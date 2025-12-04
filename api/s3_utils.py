import os
import boto3
from botocore.exceptions import ClientError

# ================================================
#                  S3 Settings
# ================================================

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "admin")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "password")
AWS_DEFAULT_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "network-threat-detector")
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL", "http://minio:9000")

# ================================================

def get_s3_client() -> boto3.client:
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_DEFAULT_REGION
    )
    
def create_s3_bucket(s3_client: boto3.client, bucket_name: str):
    existing_buckets = s3_client.list_buckets()
    if not any(bucket['Name'] == bucket_name for bucket in existing_buckets.get('Buckets', [])):
        s3_client.create_bucket(Bucket=bucket_name)
        
def apply_s3_deletion_policy(s3_client: boto3.client, bucket_name: str, prefix: str):
    try:
        existing = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = existing.get("Rules", [])
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchLifecycleConfiguration":
            rules = []
        else:
            raise

    # Define the new lifecycle rule
    new_rule = {
        "ID": "DeleteOldUploads",
        "Filter": {"Prefix": prefix},
        "Status": "Enabled",
        "Expiration": {"Days": 7},
    }

    # Deduplicate by ID or Filter if necessary
    rules = [r for r in rules if r.get("ID") != new_rule["ID"]]
    rules.append(new_rule)

    # Apply updated lifecycle configuration
    s3_client.put_bucket_lifecycle_configuration(
        Bucket=bucket_name,
        LifecycleConfiguration={"Rules": rules}
    )
    