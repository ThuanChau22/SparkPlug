import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps

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


####################################################################################################
# Routes
####################################################################################################


# Test routes
@app.route("/api/sql/ping", methods=["GET"])
def ping():
    return {"message": "Pong"}


@app.route("/api/sql/evses_joined", methods=["GET"])
def get_evses_joined():
    query = build_query("evses_joined", request.args)
    data = fetch_data(query)
    return jsonify(data)


@app.route("/api/test_auth", methods=["GET"])
@require_permission("staff")  # Only staff can access this route
def test_auth(user=None):
    if user:
        return (
            jsonify(
                {"message": f"Hello, user {user['user_id']} with role {user['role']}!"}
            ),
            200,
        )
    else:
        return jsonify({"message": "No user information provided."}), 400


########## Site CRUD routes
# read sites
@app.route("/api/sql/sites", methods=["GET"])
def get_sites():
    query = build_query("Site", request.args)
    data = fetch_data(query)
    return jsonify(data)


# read site by id
@app.route("/api/sql/sites/<int:site_id>", methods=["GET"])
def get_site_by_id(site_id):
    query = f"SELECT * FROM Site WHERE id = {site_id}"
    data = fetch_data(query)
    return jsonify(data)


# create site
@app.route("/api/sql/sites", methods=["POST"])
@require_permission("owner", "staff")
def create_site(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json

    owner_id = sanitize_input(body.get("owner_id"))
    if user["role"] == "owner":
        owner_id = user["user_id"]

    query = f"INSERT INTO Site (owner_id, latitude, longitude, name, street_address, zip_code, city, state, country) VALUES ({owner_id}, '{sanitize_input(body['latitude'])}', {sanitize_input(body['longitude'])}, '{sanitize_input(body['name'])}', '{sanitize_input(body['street_address'])}', '{sanitize_input(body['zip_code'])}', '{sanitize_input(body['city'])}', '{sanitize_input(body['state'])}', '{sanitize_input(body['country'])}')"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        site_id = cursor.lastrowid
        sql_connection.commit()

    return {"message": "Site created successfully", "id": site_id}, 201


# update site
@app.route("/api/sql/sites/<int:site_id>", methods=["PATCH"])
@require_permission("owner", "staff")
def update_site(site_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM Site WHERE id = {site_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE Site SET "
    for key, value in body.items():
        query += f"{key} = '{sanitize_input(value)}', "
    query = query[:-2]
    query += f" WHERE id = {site_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "Site updated successfully", "id": site_id}, 200


# delete site
@app.route("/api/sql/sites/<int:site_id>", methods=["DELETE"])
@require_permission("owner", "staff")
def delete_site(site_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM Site WHERE id = {site_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"DELETE FROM Site WHERE id = {site_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "Site deleted successfully", "id": site_id}, 200


########## Station CRUD routes
# read stations
@app.route("/api/sql/stations", methods=["GET"])
def get_stations():
    query = build_query("stations_joined", request.args)
    data = fetch_data(query)
    return jsonify(data)


# read station by id
@app.route("/api/sql/stations/<int:station_id>", methods=["GET"])
def get_station_by_id(station_id):
    query = f"SELECT * FROM stations_joined WHERE id = {station_id}"
    data = fetch_data(query)
    return jsonify(data)


# create station
@app.route("/api/sql/stations", methods=["POST"])
@require_permission("owner", "staff")
def create_station(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json
    site_id = sanitize_input(body.get("site_id"))

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM Site WHERE id = {site_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"INSERT INTO Station (name, latitude, longitude, site_id) VALUES ('{sanitize_input(body['name'])}', '{sanitize_input(body['latitude'])}', '{sanitize_input(body['longitude'])}', {site_id})"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        station_id = cursor.lastrowid
        sql_connection.commit()

    return {"message": "Station created successfully", "id": station_id}, 201


# update station
@app.route("/api/sql/stations/<int:station_id>", methods=["PATCH"])
@require_permission("owner", "staff")
def update_station(station_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json
    station_id = sanitize_input(station_id)

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM stations_joined WHERE id = {station_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE Station SET "
    for key, value in body.items():
        query += f"{key} = '{sanitize_input(value)}', "
    query = query[:-2]
    query += f" WHERE id = {station_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "Station updated successfully", "id": station_id}, 200


# delete station
@app.route("/api/sql/stations/<int:station_id>", methods=["DELETE"])
@require_permission("owner", "staff")
def delete_station(station_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    station_id = sanitize_input(station_id)

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM stations_joined WHERE id = {station_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"DELETE FROM Station WHERE id = {station_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "Station deleted successfully", "id": station_id}, 200


########## EVSE CRUD routes
# read evses
@app.route("/api/sql/stations/evses", methods=["GET"])
def get_evses():
    query = build_query("evses_joined", request.args)
    data = fetch_data(query)
    return jsonify(data)


# read evses by station
@app.route("/api/sql/stations/<int:station_id>/evses", methods=["GET"])
def get_evses_by_station(station_id):
    condition = f"station_id = {station_id}"
    query = f"SELECT * FROM evses_joined WHERE {condition}"
    data = fetch_data(query)
    return jsonify(data)


# read evse by ids
@app.route("/api/sql/stations/<int:station_id>/evses/<int:evse_id>", methods=["GET"])
def get_evse_by_id(station_id, evse_id):
    condition = f"station_id = {station_id} AND evse_id = {evse_id}"
    query = f"SELECT * FROM evses_joined WHERE {condition}"
    data = fetch_data(query)
    return jsonify(data)


# create evse
@app.route("/api/sql/stations/<int:station_id>/evses", methods=["POST"])
@require_permission("owner", "staff")
def create_evse(station_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json
    station_id = sanitize_input(station_id)
    evse_id = sanitize_input(body["evse_id"])

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM stations_joined WHERE id = {station_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"INSERT INTO EVSE (station_id, evse_id, connector_type, price, charge_level) VALUES ({station_id}, {evse_id}, '{sanitize_input(body['connector_type'])}', {sanitize_input(body['price'])}, '{sanitize_input(body['charge_level'])}')"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    query = f"SELECT evse_id FROM EVSE ORDER BY created_at DESC LIMIT 1"
    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchone()
        evse_id = data["evse_id"]

    return {"message": "EVSE created successfully", "id": evse_id}, 201


# update evse
@app.route("/api/sql/stations/<int:station_id>/evses/<int:evse_id>", methods=["PATCH"])
@require_permission("owner", "staff")
def update_evse(station_id, evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    body = request.json

    if user["role"] == "owner":
        station_id = sanitize_input(station_id)
        evse_id = sanitize_input(evse_id)
        condition = f"station_id = {station_id} AND evse_id = {evse_id}"
        query = f"SELECT owner_id FROM evses_joined WHERE {condition}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE EVSE SET "
    for key, value in body.items():
        query += f"{key} = '{sanitize_input(value)}', "
    query = query[:-2]
    query += f" WHERE station_id = {station_id} AND evse_id = {evse_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "EVSE updated successfully", "id": evse_id}, 200


# delete evse
@app.route("/api/sql/stations/<int:station_id>/evses/<int:evse_id>", methods=["DELETE"])
@require_permission("owner", "staff")
def delete_evse(station_id, evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    if user["role"] == "owner":
        station_id = sanitize_input(station_id)
        evse_id = sanitize_input(evse_id)
        condition = f"station_id = {station_id} AND evse_id = {evse_id}"
        query = f"SELECT owner_id FROM evses_joined WHERE {condition}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            data = cursor.fetchone()
        if not data:
            return {"message": "Resource not found"}, 404
        if data["owner_id"] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"DELETE FROM EVSE WHERE station_id = {station_id} AND evse_id = {evse_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "EVSE deleted successfully", "id": evse_id}, 200


# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
