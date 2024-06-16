import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps

# Internal Modules
from src.config import (
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    SQL_API_ENDPOINT,
    MONGO_API_ENDPOINT,
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


def get_transactions(query_params, header):
    try:
        response = requests.get(
            url=f"{MONGO_API_ENDPOINT}/transactions",
            params=query_params,
            headers=header,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

    try:
        return response.json()
    except ValueError:
        print("Error: Response does not contain valid JSON")
        return None


def get_evse_status(query_params, header):
    try:
        response = requests.get(
            url=f"{MONGO_API_ENDPOINT}/evse_status", params=query_params, headers=header
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

    try:
        return response.json()
    except ValueError:
        print("Error: Response does not contain valid JSON")
        return None


def get_sites(query_params, header):
    try:
        response = requests.get(
            url=f"{SQL_API_ENDPOINT}/sites", params=query_params, headers=header
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

    try:
        return response.json()
    except ValueError:
        print("Error: Response does not contain valid JSON")
        return None


def get_stations(query_params, header):
    try:
        response = requests.get(
            url=f"{SQL_API_ENDPOINT}/stations", params=query_params, headers=header
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

    try:
        return response.json()
    except ValueError:
        print("Error: Response does not contain valid JSON")
        return None


def get_evses(query_params, header):
    try:
        response = requests.get(
            url=f"{SQL_API_ENDPOINT}/evses", params=query_params, headers=header
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

    try:
        return response.json()
    except ValueError:
        print("Error: Response does not contain valid JSON")
        return None


####################################################################################################
# Routes
####################################################################################################


# Base endpoint
@app.route("/api/stations/analytics", methods=["GET"])
def base_endpoint():
    message = "SparkPlug Analytics API!"
    return {"message": message}, 200


# Get stations
@app.route("/api/stations", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_stations(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args
    jwt = request.headers.get("Authorization")

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations", params=args, headers={"Authorization": jwt}
    )

    return response.json()


# Get Transactions
@app.route("/api/stations/analytics/transactions", methods=["GET"])
@require_permission("staff", "owner")
def read_transactions(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args
    jwt = request.headers.get("Authorization")

    tranactions_params_out = {}
    stations_params_out = {}

    for key in args.keys():
        if key == "station_id" or key == "start_date" or key == "end_date":
            tranactions_params_out[key] = args[key]

    for key in args.keys():
        if (
            key == "site_id"
            or key == "country"
            or key == "state"
            or key == "city"
            or key == "zip_code"
        ):
            stations_params_out[key] = args[key]

    if stations_params_out:
        stations = get_stations(stations_params_out, {"Authorization": jwt})
        if stations is not None:
            station_ids = [station["station_id"] for station in stations]
            tranactions_params_out["station_id"] = station_ids

    transactions = get_transactions(tranactions_params_out, {"Authorization": jwt})

    if transactions is not None:
        return jsonify(transactions)
    else:
        return {"message": "Error occurred while getting transactions"}, 500


# Get EVSE status updates
@app.route("/api/stations/analytics/evse_status", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_evse_status(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args
    jwt = request.headers.get("Authorization")

    evse_status_params_out = {}
    stations_params_out = {}

    for key in args.keys():
        if key == "station_id" or key == "start_date" or key == "end_date":
            evse_status_params_out[key] = args[key]

    for key in args.keys():
        if (
            key == "site_id"
            or key == "country"
            or key == "state"
            or key == "city"
            or key == "zip_code"
        ):
            stations_params_out[key] = args[key]

    if stations_params_out:
        stations = get_stations(stations_params_out, {"Authorization": jwt})
        if stations is not None:
            station_ids = [station["station_id"] for station in stations]
            evse_status_params_out["station_id"] = station_ids

    evse_statuses = get_evse_status(args, {"Authorization": jwt})

    if evse_statuses is not None:
        return jsonify(evse_statuses)
    else:
        return {"message": "Error occurred while getting transactions"}, 500


# Handle path not found
@app.errorhandler(404)
def path_not_found(_):
    message = f"The requested path {request.path} was not found on server."
    return {"message": message}, 404
