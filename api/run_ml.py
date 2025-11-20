from redis_utils import *
from s3_utils import *
from api_types import *
from utils import *

from rq import Worker
from pathlib import Path
import os
import tempfile
import uuid
import shutil
import pandas as pd
import numpy as np
import joblib
import redis

NON_NUMERIC_COLS = ["Timestamp"]
MODEL_ENV_VAR = "RF_MODEL_PATH"
_model_bundle = None

def load_model_bundle():
    #lazy load RF bundle from disk

    global _model_bundle
    if _model_bundle is not None: 
        return _model_bundle
    
    #allow overriding via env var
    model_path_env = os.environ.get(MODEL_ENV_VAR)
    candidates: list[Path] = []
    if model_path_env:
        candidates.append(Path(model_path_env))

    #fallback
    here = Path(__file__).parent
    candidates.append(here / "ml" /"rf_cicids2018.joblib")

    model_path = None
    for c in candidates:
        if c.exists():
            model_path = c
            break
    
    if model_path is None:
        raise FileNotFoundError(
            "Could not find rf_cicids2018.joblib"
            "set RF_MODEL_PATH env var or place the file next to run_ml.py"
        )
    
    print(f"[run_ml] Loading model bundle from {model_path}")
    _model_bundle = joblib.load(model_path)
    return _model_bundle

def prepare_features(df: pd.DataFrame, feature_names: list[str]) -> tuple[pd.DataFrame, pd.Index]:
    #drop non num cols, convert to numeric, drop NaNs
    #return X: df with exact feature columns, kept_idx: index of rows kept
    for col in NON_NUMERIC_COLS:
        if col in df.columns:
            df = df.drop(columns=[col])

    X = df[feature_names].apply(pd.to_numeric, errors="coerce")
    X = X.replace([np.inf, -np.inf], np.nan)
    
    mask = ~X.isna().any(axis=1)
    X = X[mask]

    kept_idx = X.index

    #ensure all expected features exist
    missing = [c for c in feature_names if c not in X.columns]
    if missing:
        raise ValueError(f"Missing expected features in flow CSV: {missing[:10]}...")
    
    #reorder to match training cols
    X = X[feature_names]
    return X, kept_idx

def run_ml(flow_key: str, assignment_id: str | None = None) -> JobResult:
    #ML job: download flow csv from s3, run RF model, upload predictions csv. 

    HEALTH = healthcheck()
    if not HEALTH.all_good():
        return HealthCheckResult.new(HEALTH).model_dump_json()
    
    S3 = get_s3_client()
    result = JobResult.new()

    tmpdir = tempfile.mkdtemp()
    try:
        #down flow csv from s3
        local_flow_path = os.path.join(tmpdir, os.path.basename(flow_key))
        print(f"[run_ml] Downloading flow CSV s3://{S3_BUCKET}/{flow_key} to {local_flow_path}")
        S3.download_file(S3_BUCKET, flow_key, local_flow_path)

        #local model and flow csv
        bundle = load_model_bundle()
        model = bundle["model"]
        feature_names: list[str] = bundle["feature_names"]

        df = pd.read_csv(local_flow_path)
        print(f"[run_ml] Loaded flow CSV with shape {df.shape}")

        #prepare features
        X, kept_idx = prepare_features(df, feature_names)
        if X.empty:
            print("[run_ml] No valid rows after cleaning: aborting")
            result.success = False
            #if jobresult has a message field, record it
            try:
                result.message = "No valid rows in flow CSV after cleaning"
            except AttributeError:
                pass
            result.next_job_id = None
            return result.model_dump_json()
        print(f"[run_ml] Using {len(X)} rows for prediction")

        #predict
        y_pred = model.predict(X)

        #attach predictions to the kept subset of rows
        df_pred = df.loc[kept_idx].copy()
        df_pred["Prediction"] = y_pred

        #upload predictions csv to s3
        pred_local = os.path.join(tmpdir, f"predictions_{uuid.uuid4()}.csv")
        df_pred.to_csv(pred_local, index=False)

        pred_key = f"predictions/{uuid.uuid4()}.csv"
        print(f"[run_ml] Uploading predictions CSV to s3://{S3_BUCKET}/{pred_key}")
        S3.upload_file(pred_local, S3_BUCKET, pred_key)

        #optionally update assignment record
        if assignment_id is not None:
            REDIS = get_redis_client()
            assignment = get_assignment(REDIS, assignment_id)
            if assignment is not None:
                #field for result key
                REDIS.set(f"assignment:{assignment.id}",
                          assignment.model_dump_json(),
                          ex=604800
                          )
        
        #fill JobResult
        result.success = True
        result.next_job_id = None
        try:
            #if JobResult has a 'message' field, store S3 location
            result.message = f"Predictions stored at s3//{S3_BUCKET}/{pred_key}"
        except AttributeError:
            pass

        return result.model_dump_json()
    
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    REDIS = get_redis_client()
    
    try:
        REDIS.ping()
    except redis.exceptions.ConnectionError:
        print("Could not connect to the Redis server!")
        exit(1)
    
    worker = Worker(get_ml_queue(REDIS))
    worker.work(burst=False)