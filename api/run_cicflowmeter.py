from redis_utils import *
from s3_utils import *
from api_types import *
from utils import *

from rq import Worker
import os, subprocess, tempfile, uuid, shutil

def run_cicflowmeter(s3_key, assignment_id: str | None = None) -> JobResult:
    HEALTH = healthcheck()
    
    if HEALTH.all_good():
        S3 = get_s3_client()
        
        REDIS = get_redis_client()
        ML_QUEUE = get_ml_queue(REDIS)
    else:
        return HealthCheckResult.new(HEALTH).model_dump_json()
    
    result = JobResult.new()
    
    # ======== Download pcap from S3 ========
    
    pcap_directory = tempfile.mkdtemp()
    pcap_filepath = os.path.join(pcap_directory, os.path.basename(s3_key))
    S3.download_file(S3_BUCKET, s3_key, pcap_filepath)
    
    # ======== Run CICFlowMeter on pcap file ========

    output_directory = tempfile.mkdtemp()
    
    subprocess.run(["gradle", "--no-daemon", f"-Pcmdargs={pcap_directory}:{output_directory}", "runcmd"], check=True, cwd="/worker")

    # ======== Upload output CSV to MinIO ========

    for file in os.listdir(output_directory):
        if file.endswith(".csv"):
            flow_key = f"flows/{uuid.uuid4()}.csv"
            S3.upload_file(os.path.join(output_directory, file), S3_BUCKET, flow_key)
            break
        
    shutil.rmtree(pcap_directory, ignore_errors=True)
    shutil.rmtree(output_directory, ignore_errors=True)
        
    # ======== Finally, enqueue ML job with flow information ========
    
    assignment = get_assignment(REDIS, assignment_id)
    if assignment is not None:
        pass # TODO
    #ml_job = ML_QUEUE.enqueue(None, flow_key) # TODO: Replace None with actual ML processing function
            
        
    result.success = True
    result.next_job_id = None # TODO: ml_job.id
    return result.model_dump_json()

if __name__ == "__main__":
    REDIS = get_redis_client()
    
    try:
        REDIS.ping()
    except redis.exceptions.ConnectionError:
        print("Could not connect to the Redis server!")
        exit(1)
    
    worker = Worker(get_pcap_queue(REDIS))
    worker.work(burst=False)