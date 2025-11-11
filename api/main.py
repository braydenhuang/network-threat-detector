from redis_utils import *
from api_types import *

from utils import *

from flask import Flask

app = Flask(__name__)

HEALTH = healthcheck()

REDIS = get_redis_connection()

# API root
@app.route('/')
def root():
    return HEALTH.model_dump_json()

if __name__ == '__main__':

    # run() method of Flask class runs the application 
    # on the local development server.
    app.run()