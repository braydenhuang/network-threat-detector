import redis
import os

# ================================================
#                  API Settings
# ================================================

REDIS_HOSTNAME = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))

# ================================================

def get_redis_connection() -> redis.Redis:
    return redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT)