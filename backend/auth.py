from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import jsonify, request

try:
    from .config import Config
except ImportError:
    from config import Config


def create_token(admin_id):
    payload = {
        "sub": admin_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def admin_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header.replace("Bearer ", "").strip()

        if not token:
            return jsonify({"error": "Admin token missing"}), 401

        try:
            jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid or expired admin token"}), 401

        return handler(*args, **kwargs)

    return wrapper
