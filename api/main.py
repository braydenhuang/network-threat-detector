from redis_utils import *
from s3_utils import *
from api_types import *
from utils import *
from run_cicflowmeter import run_cicflowmeter

from flask import Flask, request
from werkzeug.datastructures import FileStorage
import uuid

app = Flask(__name__)

HEALTH = healthcheck()

REDIS = get_redis_client()
if HEALTH.redis.working:
    PCAP_QUEUE = get_pcap_queue(REDIS)
    ML_QUEUE = get_ml_queue(REDIS)


S3 = get_s3_client()
if HEALTH.s3.working:
    create_s3_bucket(S3, S3_BUCKET)
    apply_s3_deletion_policy(S3, S3_BUCKET, prefix="uploads/")

# API root
@app.route('/')
def root():
    return HEALTH.model_dump_json()

# Upload pcap file
@app.route("/upload", methods=["POST"])
def upload():
    response = UploadResponse.new()
    
    if not HEALTH.all_good():
        response.message = "The API is having technical issues, please try again later!"
        return response.model_dump_json(), 500
    
    if "file" not in request.files:
        response.message = "No file found in the request!"
        return response.model_dump_json(), 400

    file: FileStorage = request.files["file"]
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{file_id}.pcap"
    
    # Upload the file to S3
    S3.upload_fileobj(file, S3_BUCKET, s3_key)

    # Enqueue the pcap processing job with reference to the uploaded .pcap file in S3
    cicflowmeter_job = PCAP_QUEUE.enqueue(run_cicflowmeter, s3_key)
    
    # Get the size of the uploaded file
    file_size = S3.head_object(Bucket=S3_BUCKET, Key=s3_key)["ContentLength"]
    
    # Send our response
    response.report_success(file, file_size, job_id=cicflowmeter_job.id)
    return response.model_dump_json(), 202

if __name__ == '__main__':
    app.run()