from flask import Blueprint, request
from ..service.network_state import NETWORK
from ..service.engine import network_engine
device_bp = Blueprint("device", __name__, url_prefix="/api/device")

@device_bp.get("/")
def get_devices():
    devices = NETWORK.getAllDevices()

    return {
        "devices": [
            {
                "id": device.getId(),
                "type": str(device.getType()),
                "ip": device.getIpAddress()
            }
            for device in devices
        ]
    }, 200

@device_bp.get("/<int:device_id>")
def get_device():

    device = NETWORK.getDevice(device_id)
    if device is None:
        return {
            "device": "No such Device exists"
        }, 400

    return {
        "id": device.getId(),
        "type": str(device.getType()),
        "ip": device.getIpAddress()
    }, 200

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

    device_type = getattr( # was bug there somehow got this no idea what this is
        network_engine.DeviceType,
        data.get("type", "Computer"),
        None
    )
    if device_type is None:
        return {"error": "Invalid device type"}, 400
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


@device_bp.delete("/<int:device_id>")
def delete_device(device_id):
    if NETWORK.getDevice(device_id) is None:
        return {"error": "No such Device exists"}, 404

    NETWORK.delete_device(device_id)

    return {
        "device": "deleted",
        "device ID": device_id
    }, 200


