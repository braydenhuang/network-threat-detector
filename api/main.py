from redis_utils import *
from s3_utils import *
from api_types import *
from utils import *

from flask import Flask, request
from werkzeug.datastructures import FileStorage
import boto3
import os
import uuid

app = Flask(__name__)

HEALTH = healthcheck()

REDIS = get_redis_client()
S3 = get_s3_client()

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
        return response.model_dump_json(), 200 # Still 200 for graceful frontend handling
    
    if "file" not in request.files:
        response.message = "No file found in the request!"
        return response.model_dump_json(), 400

    file: FileStorage = request.files["file"]
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{file_id}.pcap"
    #s3.upload_fileobj(file, BUCKET, s3_key)

    #job = q.enqueue("tasks.run_cicflowmeter", s3_key)
    
    response.report_success(file)
    return response.model_dump_json(), 202

if __name__ == '__main__':
    app.run()