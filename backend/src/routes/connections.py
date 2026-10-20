from flask import Blueprint, request
from ..service.network_state import NETWORK
connection_bp = Blueprint("connection", __name__, url_prefix="/api/connection")

@connection_bp.post("/")
def create_connection():
    data = request.get_json()
    
    source = data.get_json("source")
    destination = data.get_json("destination")
    cost = data.get_json("cost")

    if source is None or cost is None or destination is None:
        return{
            "request": "Incomplete request"
        }, 400
    if NETWORK.getDevice(source) is None:
        return {
            "error": "No Source"
        }, 400
    if NETWORK.getDevice(destination) is None:
        return {
            "error": "No destination"
        }, 400

    if source == destination:
        return {
            "error": "source can't map to itself"
        }, 400

    NETWORK.addConnection(source, destination, cost)
    return {
        "connection": "added",
        "source": source,
        "destination": destination,
        "cost": cost
    }, 201

@connection_bp.post("/<int:device_id>")
def get_connection():
    device = NETWORK.getDevice(device_id)
    if device is None:
        return {
            "Device": "No such device found"
        }, 400

    connections = NETWORK.getConnections(device_id)
    return {
        "device_id": device_id,
        "connections": [
            {
                "destination": connection.getDestinationId(),
                "cost": connection.getCost()
            } for connection in connections
        ]
    }, 200