from flask import Blueprint, request

connection_bp = Blueprint("connection", __name__, url_prefix="/api/connection")