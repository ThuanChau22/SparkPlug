import requests
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymysql import MySQLError
from functools import wraps
from urllib.parse import urljoin

# Internal Modules
from config import (
    PORT,
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    mysql_pool,
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


# Sanitize input
def sanitize_input(input_string):
    """
    Sanitizes the input string by escaping potentially dangerous characters
    and removing newline characters.
    :param input_string: The string to be sanitized.
    :return: Sanitized string.
    """
    if not isinstance(input_string, str):
        return input_string

    sanitized_string = input_string.replace("\n", "").replace("\r", "")
    sanitized_string = sanitized_string.replace("'", "\\'").replace('"', '\\"')

    return sanitized_string

def build_query(table, query_params):
    if not query_params:
        return f"SELECT * FROM {table}"
    
    query = f"SELECT * FROM {table} WHERE "
    for key, value in query_params.items():
        query += f"{key} = '{sanitize_input(value)}' AND "
    query = query[:-4]

    return query

def fetch_data(query):
    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()

    return data

# Routes
@app.route("/api/sql/ping", methods=["GET"])
def ping():
    return {"message": "Pong"}

@app.route("/api/sql/stations_joined", methods=["GET"])
def get_stations_joined():
    query = build_query("stations_joined", request.args)
    data = fetch_data(query)
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)