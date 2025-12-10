from redis_utils import *
from s3_utils import *
from api_types import *

import boto3

# Healthcheck Functions

def healthcheck() -> Health:
    health = Health(redis=Service.new(), s3=Service.new())

    # Check Redis connectivity
    r = redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT, password=REDIS_PASSWORD, socket_connect_timeout=1, socket_timeout=1)
    try:
        r.ping() # Simple call to check connectivity
    except redis.exceptions.ConnectionError as e:
        health.redis.working = False
        health.redis.message = str(e)
    r.close()
    
    # Check S3 connectivity
    s3 = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_DEFAULT_REGION
    )
    
    try:
        s3.list_buckets() # Simple call to check connectivity
        s3.create_bucket(Bucket=S3_BUCKET) # Ensure the bucket exists
    except s3.exceptions.BucketAlreadyOwnedByYou:
        pass
    except Exception as e:
        health.s3.working = False
        health.s3.message = str(e)
        
    s3.close()

    return health