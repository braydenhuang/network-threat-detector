from redis_utils import *
from api_types import *

# Healthcheck Functions

def healthcheck() -> Health:
    health = Health(redis=Service.new())

    r = redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT, socket_connect_timeout=1, socket_timeout=1)
    try:
        r.ping()
    except redis.exceptions.ConnectionError as e:
        health.redis.working = False
        health.redis.message = str(e)
        
    r.close()

    return health