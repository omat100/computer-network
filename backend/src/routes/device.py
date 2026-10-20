from flask import Blueprint, request
import random
from ..service.network_state import NETWORK
from ....engine.build import network_engine
device_bp = Blueprint("device", __name__, url_prefix="/api/device")

@device_bp.post("/add")
def add_device():
    data = request.get_json()
    if not data:
        return {
            "error": "data not in correct format"
        }, 400
    
    device_id = data.get("id")

    if device_id is None:
        return {"error": "Device ID is required"}, 400

    if NETWORK.getDevice(device_id) is not None:
        return {"error": "Device ID already exists"}, 409

    try:
        device_type = network_engine.DeviceType[data.get("type", "Computer")]
    except KeyError:
        return{
            "data type": "invalid"
        }, 400
    if data.get("ip") is None:
        return {
            "ip": "No IP address was entered"
        }, 400
    # ip = data["ip"]
    device = network_engine.Device(device_id, device_type, data["ip"])

    NETWORK.addDevice(device) # as C++ can't accept 3 diff
    # parameters we needed to create the device var

    return {
        "device": "added",
        "device ID": device_id
    }, 201


