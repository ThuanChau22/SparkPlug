import requests
from flask import request
from functools import wraps

# Internal Modules
from src.config import AUTH_API_ENDPOINT


def require_permission(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "Authorization" not in request.headers:
                return {"message": "Missing token"}, 401
            _, token = request.headers["Authorization"].split(" ")
            res = requests.post(f"{AUTH_API_ENDPOINT}/verify", json={"token": token})
            data = res.json()
            if not res.status_code == 200:
                return data, res.status_code
            if data["role"] not in allowed_roles:
                return {"message": "Permission denied"}, 403
            request.auth = {
                "user_id": data["id"],
                "role": data["role"],
            }
            return f(*args, **kwargs)

        return decorated_function

    return decorator
