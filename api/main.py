from redis_utils import *

from utils import *

from flask import Flask

app = Flask(__name__)

HEALTH = healthcheck()
API_READY = HEALTH.all_good()

REDIS = get_redis_connection()

# API root
@app.route('/')
def root():
    return get_health_report(HEALTH)

if __name__ == '__main__':

    # run() method of Flask class runs the application 
    # on the local development server.
    app.run()