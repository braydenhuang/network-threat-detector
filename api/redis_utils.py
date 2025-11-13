from rq import Queue
import redis
import os

# ================================================
#                Redis Settings
# ================================================

REDIS_HOSTNAME = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))

PCAP_JOBS_QUEUE = os.environ.get("PCAP_JOBS_QUEUE", "pcap_jobs")
ML_JOBS_QUEUE = os.environ.get("ML_JOBS_QUEUE", "ml_jobs")

# ================================================

def get_redis_client() -> redis.Redis:
    return redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT)

def get_pcap_queue(redis_client: redis.Redis) -> Queue:
    return Queue(name=PCAP_JOBS_QUEUE, connection=redis_client)

def get_ml_queue(redis_client: redis.Redis) -> Queue:
    return Queue(name=ML_JOBS_QUEUE, connection=redis_client)