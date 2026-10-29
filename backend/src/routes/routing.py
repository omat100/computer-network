from flask import Blueprint, request
from ..service.network_state import NETWORK, PATHFINDER
routing_bp = Blueprint("routing", __name__, url_prefix="/api/routing")

@routing_bp.post("/bfs")
def route():
    data = request.get_json(silent=True) or {}
    source = data.get("source")
    if source is None:
        return {"error": "Not a valid source"}, 400
    destination = data.get("destination")
    if destination is None:
        return {"error": "Not a valid destination"}, 400

    if NETWORK.getDevice(source) is None:
        return {"error":"No such source exists"}, 400
    if NETWORK.getDevice(destination) is None:
        return {"error": "No such destination exists"}, 400

    path = PATHFINDER.findPath(NETWORK.engine, source, destination)
    print("path:", list(path), flush=True)
    return {"path":list(path)}, 200
