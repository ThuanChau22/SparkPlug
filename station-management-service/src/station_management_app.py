import requests
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymysql import MySQLError
from functools import wraps
from urllib.parse import urljoin
import os

# Internal Modules
from config import (
    PORT,
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    SQL_API_ENDPOINT,
    MONGO_API_ENDPOINT
)


# Flash App
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": WEB_DOMAIN}})


# Decorator for access control
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
            valid_user = {
                "user_id": data["id"],
                "role": data["role"],
            }
            return f(*args, **kwargs, user=valid_user)

        return decorated_function

    return decorator


####################################################################################################
# Routes
####################################################################################################

# Test Route
@app.route("/api/station_management_test", methods=["GET"])
def test():
    return {"message": "Station Management Service is up and running!"}

'''
########## Site Management Routes
@app.route("/api/sites", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_sites(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args
    jwt = request.headers.get('Authorization')

    response = requests.get(
        url=f'{SQL_API_ENDPOINT}/sites', 
        params=args, 
        headers={'Authorization': jwt}
    )

    return response.json()
'''

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
