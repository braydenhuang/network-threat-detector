from api_types import *

from collections.abc import Callable
from rq.job import Job
from rq import Queue
import redis
import os

# ================================================
#                Redis Settings
# ================================================

REDIS_HOSTNAME = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", None)

PCAP_JOBS_QUEUE = os.environ.get("PCAP_JOBS_QUEUE", "pcap_jobs")
ML_JOBS_QUEUE = os.environ.get("ML_JOBS_QUEUE", "ml_jobs")

# ================================================

def get_redis_client() -> redis.Redis:
    return redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT, password=REDIS_PASSWORD)

def get_pcap_queue(redis_client: redis.Redis) -> Queue:
    return Queue(name=PCAP_JOBS_QUEUE, connection=redis_client)

def get_ml_queue(redis_client: redis.Redis) -> Queue:
    return Queue(name=ML_JOBS_QUEUE, connection=redis_client)

def enqueue_job(redis_client: redis.Redis, 
                queue: Queue,
                stage: Stage, 
                assignment: Assignment,
                func: Callable, 
                *args, 
                **kwargs,
                ) -> Assignment:
    # Enqueue the job in redis queue  
    job = queue.enqueue(
                    func, 
                    args=args, 
                    kwargs=kwargs, 
                    connection=redis_client,
                    result_ttl=604800, # Keep results for 7 days
                    ttl=300 # Job expires in 5 minutes if not started
                    )
    
    # Write down the job's new ID
    stage.id = job.id
    
    # Append the stage to the assignment
    assignment.stages.append(stage)
    
    # Record the assignment changes in Redis
    redis_client.set(f"assignment:{assignment.id}", assignment.model_dump_json(), ex=604800) # Assignment record expires in 7 days
    
    return assignment

def get_assignment(redis_client: redis.Redis, id: str | None) -> Assignment | None:
    if id is None:
        return None
    
    data = redis_client.get(f"assignment:{id}")
    if data is None:
        return None
    
    return Assignment.model_validate_json(data)

def get_job(redis_client: redis.Redis, id: str) -> Job | None:
    try:
        job = Job.fetch(id, connection=redis_client)
        return job
    except:
        return None
    
    