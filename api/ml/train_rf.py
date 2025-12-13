from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

import matplotlib.pyplot as plt

DATA_DIR = Path("E:")
PATTERN = "*TrafficForML_CICFlowMeter.csv"
TARGET_COL = "Label"
NON_NUMERIC_COLS = ["Timestamp"]

#how much to sample from each file
SAMPLE_FRAC = 0.05

RARE_LABELS = {
    "SQL Injection",
    "Brute Force -Web",
    "Brute Force -XSS",
}

def get_csv_files():
    files = sorted(DATA_DIR.glob(PATTERN))
    if not files:
        raise RuntimeError(f"No CSV files matching {PATTERN} in {DATA_DIR}")
    return files

def stratified_sample(df, frac, label_col=TARGET_COL):
    #take a stratified random sample by label so each label contributes roughly frac of its rows
    return df.groupby(label_col, group_keys=False).sample(frac=frac, random_state=42)

def clean_and_split(df):
    #split into X, y, clean up values
    feature_cols = [c for c in df.columns if c not in (TARGET_COL, *NON_NUMERIC_COLS)]

    X = df[feature_cols].apply(pd.to_numeric, errors="coerce")
    y = df[TARGET_COL]

    #drop NaNs in features
    X = X.replace([np.inf, -np.inf], np.nan)
    mask = ~X.isna().any(axis=1)
    X = X[mask]
    y = y[mask]

    return X,y, feature_cols

def read_csv_safe(path):
    try:
        return pd.read_csv(
            path,
            encoding="latin1",
            low_memory=False,
            on_bad_lines="skip"
        )
    except UnicodeDecodeError:
        print(f"   !! UTF-8 decode failed for {path.name}, trying latin1")
        return pd.read_csv(
            path,
            encoding="latin1",
            low_memory=False,
            on_bad_lines="skip"
        )

def load_sampled_data():
    files = get_csv_files()
    all_X = []
    all_y = []
    feature_cols = None

    for f in files:
        if "Thuesday-20-02-2018" in f.name:
            print(f"skipping bad file {f.name}")
            continue
        print(f"Loading {f.name}...")
        df = read_csv_safe(f)
        #df = pd.read_csv(f, encoding="latin1", low_memory=False, on_bad_lines="skip")
        df_sample = stratified_sample(df,frac=SAMPLE_FRAC)
        print(f"  -> sampled {len(df_sample)} rows from {len(df)}")

        X_part, y_part, f_cols = clean_and_split(df_sample)
        if feature_cols is None:
            feature_cols = f_cols
        else:
            if feature_cols != f_cols:
                raise ValueError("Feature columns mismatch in {f}")
        all_X.append(X_part)
        all_y.append(y_part)
        print(f" sampled {len(X_part)} rows")

    X = pd.concat(all_X, ignore_index=True)
    y = pd.concat(all_y, ignore_index=True)

    mask = ~y.isin(RARE_LABELS)
    removed = len(y) - mask.sum()
    if removed>0:
        print(f"\nDropping {removed} rows from rare classes: {RARE_LABELS}")
    
    X = X[mask]
    y = y[mask]

    print(f"\nTotal training rows after sampling and cleaning: {len(X)}")
    print("Label distribution:")
    print(y.value_counts())
    return X, y, feature_cols

def evaluate_model(name, model, X_train, X_test, y_train, y_test):
    print(f"\n===== Training {name} =====")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"\n===== {name} classification report =====")
    print(classification_report(y_test,y_pred))
    return model

def save_rf_feature_importance_plot(rf_pipeline, feature_cols, out_png: Path, top_n=25):
    rf = rf_pipeline.named_steps["randomforestclassifier"]
    importances = rf.feature_importances_
    if len(importances) != len(feature_cols):
        raise ValueError("Feature importance length mismatch with feature columns")
    
    #top N
    idx = np.argsort(importances)[::-1][:top_n]
    top_features = [feature_cols[i] for i in idx]
    top_importances = importances[idx]

    plt.figure(figsize=(10,8))
    plt.barh(range(len(top_features)), top_importances)
    plt.yticks(range(len(top_features)), top_features)
    plt.gca().invert_yaxis()
    plt.xlabel("Feature Importance (Gini)")
    plt.title(f"Random Forest Top-{top_n} Feature importances")
    plt.tight_layout()

    out_png.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_png,dpi=200)
    plt.close()
    print(f"saved feature importance plt to: {out_png.resolve()}")


def main():
    X,y, feature_cols = load_sampled_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    #pipeline to scale numeric features 
    #---------------RF-----------------
    model = make_pipeline(
        StandardScaler(),
        RandomForestClassifier(
            n_estimators=300, 
            max_depth=None, 
            min_samples_split=2, 
            min_samples_leaf=1, 
            max_features="sqrt", 
            n_jobs=-1, 
            class_weight="balanced_subsample", 
            random_state=42
            )
    )

    rf_model = evaluate_model("Random Forest", model, X_train, X_test, y_train, y_test)

    '''
    print("\nTraining Random Forest Classifier...")
    model.fit(X_train, y_train)
    print("\nEvaluation on hold-out set:")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    '''

    api_dir = Path(__file__).resolve().parents[1]
    out_path = api_dir / "ml" / "rf_cicids2018.joblib"
    joblib.dump(
        {
            "model": model,
            "feature_names": feature_cols,
            "target_col": TARGET_COL
        },
        out_path,
    )
    print(f"\nSaved model to {out_path.resolve()}")

    #RF feature importance plot
    out_png = api_dir/"ml"/"rf_feature_importance_top25.png"
    save_rf_feature_importance_plot(rf_model, feature_cols, out_png, top_n=25)

    #-------------------- Logistic Regression --------------------------
    lr_model = make_pipeline(
        StandardScaler(),
        LogisticRegression(
            max_iter=2000,
            solver="saga",
            n_jobs=-1,
            class_weight="balanced"
        )
    )

    _=evaluate_model("Logistic Regression", lr_model, X_train, X_test,y_train,y_test)

    #---------------------- SVM---------------------------------
    svm_rbf_model = make_pipeline(
        StandardScaler(),
        SVC(
            kernel="rbf",
            C=1.0,
            gamma="scale",
            class_weight="balanced"
        )
    )

    _=evaluate_model("SVM RBF", svm_rbf_model, X_train,X_test,y_train,y_test)


if __name__ == "__main__":
    main()

