import sys
import os
from flask import Flask
ENGINE_BUILD = os.path.join(os.path.dirname(__file__), "engine", "build")
sys.path.insert(0, ENGINE_BUILD)

from .src.routes.test import test_bp
from .src.routes.device import device_bp
app = Flask(__name__)

app.register_blueprint(test_bp)
app.register_blueprint(device_bp)

if __name__ == "__main__":
    app.run(debug=True, port=6050)