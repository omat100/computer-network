from flask import Flask
from .src.routes.test import test_bp
from .src.routes.device import device_bp
app = Flask(__name__)

app.register_blueprint(test_bp)
app.register_blueprint(device_bp)

if __name__ == "__main__":
    app.run(debug=True, port=6050)