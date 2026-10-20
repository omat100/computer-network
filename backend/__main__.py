import sys
import os
import threading
from flask import Flask
from flask_cors import CORS
ENGINE_BUILD = os.path.join(os.path.dirname(__file__), "engine", "build")
sys.path.insert(0, ENGINE_BUILD)

from .src.routes.test import test_bp
from .src.routes.device import device_bp
from .src.routes.connections import connection_bp
from .src.routes.routing import routing_bp
app = Flask(__name__)

# Comma-separated list of allowed frontend origins (e.g. the Vercel URL).
# Unset/"*" allows any origin, which is fine for local development.
origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
CORS(app, origins=origins)

# The C++ engine and the global NETWORK are not thread-safe, so serialise requests.
_request_lock = threading.Lock()


@app.before_request
def _acquire_lock():
    _request_lock.acquire()


@app.teardown_request
def _release_lock(_exc):
    if _request_lock.locked():
        _request_lock.release()


app.register_blueprint(test_bp)
app.register_blueprint(device_bp)
app.register_blueprint(connection_bp)
app.register_blueprint(routing_bp)

if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 6050)))
