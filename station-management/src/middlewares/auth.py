import requests
from flask import request
from functools import wraps

# Internal Modules
from src.config import AUTH_API_ENDPOINT


def require_permission(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            request.auth = {"role": "all"}
            if "Authorization" in request.headers:
                _, token = request.headers["Authorization"].split(" ")
                body = {"token": token}
                response = requests.post(f"{AUTH_API_ENDPOINT}/verify", json=body)
                data = response.json()
                if not response.status_code == 200:
                    return data, response.status_code
                if data["role"] not in allowed_roles:
                    return {"message": "Permission denied"}, 403
                request.auth = {
                    "user_id": data["id"],
                    "role": data["role"],
                }
            elif "all" not in allowed_roles:
                return {"message": "Missing token"}, 401

            return f(*args, **kwargs)

        return decorated_function

    return decorator
