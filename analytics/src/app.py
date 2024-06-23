import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from collections import defaultdict
from datetime import datetime

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


# Charting functions
def time_string_to_hours(time_str):
    try:
        hours, minutes, seconds = map(int, time_str.split(":"))
        return hours + minutes / 60 + seconds / 3600
    except ValueError:
        return 0  # Return 0 if the time format is incorrect

def generate_charts(raw_docs):
    revenue_by_date = defaultdict(float)
    sessions_by_date = defaultdict(int)
    utilization_by_date = defaultdict(float)
    energy_consumption_by_date = defaultdict(float)
    hour_counts = [0] * 24

    # return jsonify(raw_docs[0])

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        date = datetime.utcfromtimestamp(timestamp_seconds)

        # Revenue
        f_date = date.strftime("%Y-%m-%d")
        revenue_by_date[f_date] += doc["fee"]
        sessions_by_date[f_date] += 1

        # Utilization Rate
        charging_time_hours = time_string_to_hours(doc["charging_time"])
        utilization_by_date[f_date] += charging_time_hours

        # Peak Time
        hour = date.hour
        hour_counts[hour] += 1

        # Energy Consumption
        energy_consumption_by_date[f_date] += doc["energy_consumed_kwh"]

    # Calculate utilization rate as a percentage
    for date in utilization_by_date:
        utilization_by_date[date] = (
            utilization_by_date[date] / 24
        ) * 100  # Convert to percentage

    sorted_dates = sorted(revenue_by_date.keys())
    rev_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Daily Revenue",
                "data": [revenue_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
            }
        ],
    }

    sessions_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Number of Sessions",
                "data": [sessions_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(255, 99, 132, 0.6)",
            }
        ],
    }

    peak_chart_data = {
        "labels": [f"{i}:00 - {i+1}:00" for i in range(24)],
        "datasets": [{"label": "Number of Transactions", "data": hour_counts}],
    }

    utilization_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Utilization Rate (%)",
                "data": [utilization_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(153, 102, 255, 0.6)",
            }
        ],
    }

    energy_consumption_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Energy Consumption (kWh)",
                "data": [energy_consumption_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(255, 206, 86, 0.6)",
            }
        ],
    }

    data_pack = {
        "revenue": rev_chart_data,
        "sessions_count": sessions_chart_data,
        "utilization_rate": utilization_chart_data,
        "peak_time": peak_chart_data,
        "energy_consumption": energy_consumption_chart_data,
    }

    return data_pack


def generate_peak(raw_docs):
    revenue_by_date = defaultdict(float)
    sessions_by_date = defaultdict(int)
    utilization_by_date = defaultdict(float)
    hour_counts = [0] * 24

    # return jsonify(raw_docs[0])

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        date = datetime.utcfromtimestamp(timestamp_seconds)

        # Revenue
        f_date = date.strftime("%Y-%m-%d")
        revenue_by_date[f_date] += doc["fee"]
        sessions_by_date[f_date] += 1

        # Utilization Rate
        charging_time_hours = time_string_to_hours(doc["charging_time"])
        utilization_by_date[f_date] += charging_time_hours

        # Peak Time
        hour = date.hour
        hour_counts[hour] += 1

    # Calculate utilization rate as a percentage
    for date in utilization_by_date:
        utilization_by_date[date] = (
            utilization_by_date[date] / 24
        ) * 100  # Convert to percentage

    peak_chart_data = {
        "labels": [f"{i}:00 - {i+1}:00" for i in range(24)],
        "datasets": [{"label": "Number of Transactions", "data": hour_counts}],
    }

    data_pack = {"peak_time": peak_chart_data}

    return data_pack

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


@app.route("/api/stations/analytics/<station_id>", methods=["GET"])
@require_permission("staff", "owner", "driver")
def station_analytics(user, station_id):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args
    jwt = request.headers.get("Authorization")

    tranactions_params_out = {}
    stations_params_out = {}

    for key in args.keys():
        if key == "start_date" or key == "end_date":
            tranactions_params_out[key] = args[key]
    tranactions_params_out["station_id"] = station_id

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


    if user["role"] == "driver":
        return generate_peak(transactions)
    return generate_charts(transactions)

    