from redis_utils import *

from typing import TypedDict, cast

# Healthcheck Functions

class Health(TypedDict):
    redis_connected: str  # Status message of the service, empty string ("") if all good

class HealthStatus(dict):
    #Dict-like object compatible with Health that provides a helper method.
    def all_good(self) -> bool:
        return all(v == "" for v in self.values())

def healthcheck() -> Health:
    health = HealthStatus(redis_connected="")

    r = redis.Redis(host=REDIS_HOSTNAME, port=REDIS_PORT, socket_connect_timeout=1, socket_timeout=1)
    try:
        r.ping()
    except redis.exceptions.ConnectionError as e:
        health['redis_connected'] = str(e)
        
    r.close()

    return cast(Health, health)

def get_health_report(health: Health) -> str:
    message = "Status: API is up!\n" if health.all_good() else "Status: API issues detected!\n"
    
    for service, status in health.items():
        message += f"{service}: {"No issues detected" if status == "" else status}\n"
        
    return message