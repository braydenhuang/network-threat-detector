from redis_utils import *
from s3_utils import *
from api_types import *
from utils import *
from run_cicflowmeter import run_cicflowmeter

from flask import Flask, request
from typing import cast
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
    new_assignment = Assignment.new()
    enqueue_job(
                REDIS, 
                PCAP_QUEUE, 
                Stage.new_cicflowmeter_stage(),
                new_assignment, 
                run_cicflowmeter, 
                s3_key,
                new_assignment.id)
    
    # Get the size of the uploaded file
    file_size = S3.head_object(Bucket=S3_BUCKET, Key=s3_key)["ContentLength"]
    
    # Send our response
    response.report_success(file, file_size, assignment_id=new_assignment.id)
    return response.model_dump_json(), 202

@app.route("/assignment/<assignment_id>", methods=["GET"])
def get_assignment_by_id(assignment_id: str):
    assignment = get_assignment(REDIS, assignment_id)
    if assignment is None:
        return None, 404
    
    return assignment.model_dump_json()

@app.route("/job/<job_id>", methods=["GET"])
def get_job_by_id(job_id: str):
    job = get_job(REDIS, job_id)
    if job is None:
        return None, 404
    
    return JobResponse(
        id = job.id,
        status = job.get_status(),
        queue = job.origin,
        enqeued_at = str(round(job.enqueued_at.timestamp() * 1000)) if job.enqueued_at else None, # Get time in milliseconds
        ended_at = str(round(job.ended_at.timestamp() * 1000)) if job.ended_at else None,
        result = JobResult.model_validate_json(job.result) if job.is_finished else None
    ).model_dump_json()

if __name__ == '__main__':
    app.run()