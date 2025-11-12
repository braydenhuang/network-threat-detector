import redis
import os

# ================================================
#                Redis Settings
# ================================================

REDIS_HOSTNAME = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))

# ================================================

def get_redis_client() -> redis.Redis:
    return redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT)