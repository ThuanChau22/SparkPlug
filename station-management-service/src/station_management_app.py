import requests
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymysql import MySQLError
from functools import wraps
from urllib.parse import urljoin
import os
from sys import stderr

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

########## Helper Functions
def convert_coords_to_float_sites(sites):
    return [
        {**site, 'latitude': float(site['latitude']), 'longitude': float(site['longitude'])}
        for site in sites
    ]

def convert_coords_to_float_stations(stations):
    return [
        {**station, 'latitude': float(station['latitude']), 'longitude': float(station['longitude']), 'site_latitude': float(station['site_latitude']), 'site_longitude': float(station['site_longitude'])}
        for station in stations
    ]
####################################################################################################
# Routes
####################################################################################################

# Test Route
@app.route("/api/station_management_test", methods=["GET"])
def test():
    return {"message": "Station Management Service is up and running!"}

########## Site Management Routes
@app.route("/api/sites", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_sites(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args.to_dict()

    if user["role"] == 'owner':
        args['owner_id'] = user["user_id"]
    
    print(f"args: {args}", file=stderr)
    jwt = request.headers.get('Authorization')

    response = requests.get(
        url=f'{SQL_API_ENDPOINT}/sites', 
        params=args, 
        headers={'Authorization': jwt}
    )

    sites = response.json()
    sites = convert_coords_to_float_sites(sites)
    return sites

@app.route("/api/sites", methods=["POST"])
@require_permission("staff", "owner")
def create_site(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json
    if user["role"] == 'owner':
        data['owner_id'] = user["user_id"]
    jwt = request.headers.get('Authorization')

    response = requests.post(
        url=f'{SQL_API_ENDPOINT}/sites', 
        json=data, 
        headers={'Authorization': jwt}
    )

    return response.json()

@app.route("/api/sites/<int:site_id>", methods=["PATCH"])
@require_permission("staff", "owner")
def update_site(site_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json
    jwt = request.headers.get('Authorization')

    response = requests.patch(
        url=f'{SQL_API_ENDPOINT}/sites/{site_id}', 
        json=data, 
        headers={'Authorization': jwt}
    )

    return response.json()

@app.route("/api/sites/<int:site_id>", methods=["DELETE"])
@require_permission("staff", "owner")
def delete_site(site_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    jwt = request.headers.get('Authorization')

    response = requests.delete(
        url=f'{SQL_API_ENDPOINT}/sites/{site_id}', 
        headers={'Authorization': jwt}
    )

    return response.json()

########## Station Management Routes
@app.route("/api/stations", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_stations(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args.to_dict()

    if user["role"] == 'owner':
        args['owner_id'] = user["user_id"]
    jwt = request.headers.get('Authorization')

    response = requests.get(
        url=f'{SQL_API_ENDPOINT}/stations', 
        params=args, 
        headers={'Authorization': jwt}
    )

    stations = response.json()
    stations = convert_coords_to_float_stations(stations)
    return stations

@app.route("/api/stations", methods=["POST"])
@require_permission("staff", "owner")
def create_station(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json
    jwt = request.headers.get('Authorization')

    response = requests.post(
        url=f'{SQL_API_ENDPOINT}/stations', 
        json=data, 
        headers={'Authorization': jwt}
    )

    return response.json()

@app.route("/api/stations/<int:station_id>", methods=["PATCH"])
@require_permission("staff", "owner")
def update_station(station_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json
    jwt = request.headers.get('Authorization')

    response = requests.patch(
        url=f'{SQL_API_ENDPOINT}/stations/{station_id}', 
        json=data, 
        headers={'Authorization': jwt}
    )

    return response.json()

@app.route("/api/stations/<int:station_id>", methods=["DELETE"])
@require_permission("staff", "owner")
def delete_station(station_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    jwt = request.headers.get('Authorization')

    response = requests.delete(
        url=f'{SQL_API_ENDPOINT}/stations/{station_id}', 
        headers={'Authorization': jwt}
    )

    return response.json()

########## EVSE Management Routes
@app.route("/api/evses", methods=["GET"])
@require_permission("staff", "owner", "driver")
def read_evses(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    args = request.args.to_dict()

    if user["role"] == 'owner':
        args['owner_id'] = user["user_id"]
    jwt = request.headers.get('Authorization')

    response = requests.get(
        url=f'{SQL_API_ENDPOINT}/evses', 
        params=args, 
        headers={'Authorization': jwt}
    )

    evses = response.json()
    evses = convert_coords_to_float_stations(evses)
    return evses

@app.route("/api/evses", methods=["POST"])
@require_permission("staff", "owner")
def create_evse(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json
    jwt = request.headers.get('Authorization')

    response = requests.post(
        url=f'{SQL_API_ENDPOINT}/evses', 
        json=data, 
        headers={'Authorization': jwt}
    )

    return response.json()

@app.route("/api/evses/<evse_id>", methods=["PATCH"])
@require_permission("staff", "owner")
def update_evse(evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    data = request.json

    # Data for SQL API endpoint
    sql_data = {key: data[key] for key in ['connector_type', 'price', 'charge_level', 'latitude', 'longitude'] if key in data}

    # Data for Mongo API endpoint
    mongo_data = {
        'evse_id': evse_id,
        'evse_number': data.get('evse_number'),
        'station_id': data.get('station_id'),
        'status': data.get('status'),
    }

    # Send data to SQL API endpoint
    response_sql = requests.patch(
        url=f'{SQL_API_ENDPOINT}/evses/{evse_id}', 
        json=sql_data, 
        headers={'Authorization': request.headers.get('Authorization')}
    )

    # Send data to Mongo API endpoint
    response_mongo = requests.post(
        url=f'{MONGO_API_ENDPOINT}/evse_status', 
        json=mongo_data, 
        headers={'Authorization': request.headers.get('Authorization')}
    )

    return response_sql.json(), response_mongo.json()

@app.route("/api/evses/<evse_id>", methods=["DELETE"])
@require_permission("staff", "owner")
def delete_evse(evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    jwt = request.headers.get('Authorization')

    response = requests.delete(
        url=f'{SQL_API_ENDPOINT}/evses/{evse_id}', 
        headers={'Authorization': jwt}
    )

    return response.json()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)