import requests
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

@app.route('/api/test_auth', methods=['GET'])
@require_permission('staff') # Only staff can access this route
def test_auth(user=None):
    if user:
        return jsonify({"message": f"Hello, user {user['user_id']} with role {user['role']}!"}), 200
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
    
    data = request.json

    owner_id = sanitize_input(data.get("owner_id"))
    if user["role"] == "owner":
        owner_id = user["user_id"]
    
    query = f"INSERT INTO Site (owner_id, latitude, longitude, name, street_address, zip_code, city, state, country) VALUES ({owner_id}, '{sanitize_input(data['latitude'])}', {sanitize_input(data['longitude'])}, '{sanitize_input(data['name'])}', '{sanitize_input(data['street_address'])}', '{sanitize_input(data['zip_code'])}', '{sanitize_input(data['city'])}', '{sanitize_input(data['state'])}', '{sanitize_input(data['country'])}')"

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
    
    data = request.json

    if user["role"] == "owner":
        query = f"SELECT owner_id FROM Site WHERE id = {site_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE Site SET "
    for key, value in data.items():
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
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
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
    
    data = request.json
    site_id = sanitize_input(data.get("site_id"))

    if user["role"] == "owner":
        owner_id = user["user_id"]
        owned_sites = fetch_data(f"SELECT id FROM Site WHERE owner_id = {owner_id}")
        if not owned_sites or site_id not in [site["id"] for site in owned_sites]:
            return {"message": "Permission denied"}, 403

    query = f"INSERT INTO Station (name, latitude, longitude, site_id) VALUES ('{sanitize_input(data['name'])}', '{sanitize_input(data['latitude'])}', '{sanitize_input(data['longitude'])}', {site_id})"

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
    
    data = request.json

    if user["role"] == "owner":
        station_id = sanitize_input(station_id)
        query = f"SELECT owner_id FROM stations_joined WHERE station_id = {station_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE Station SET "
    for key, value in data.items():
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
    
    if user["role"] == "owner":
        station_id = sanitize_input(station_id)
        query = f"SELECT owner_id FROM stations_joined WHERE station_id = {station_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"DELETE FROM Station WHERE id = {station_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "Station deleted successfully", "id": station_id}, 200

########## EVSE CRUD routes
# read evse
@app.route("/api/sql/evses", methods=["GET"])
def get_evses():
    query = build_query("evses_joined", request.args)
    data = fetch_data(query)
    return jsonify(data)

# read evse by id
@app.route("/api/sql/evses/<int:evse_id>", methods=["GET"])
def get_evse_by_id(evse_id):
    query = f"SELECT * FROM evses_joined WHERE evse_id = {evse_id}"
    data = fetch_data(query)
    return jsonify(data)

# create evse
@app.route("/api/sql/evses", methods=["POST"])
@require_permission("owner", "staff")
def create_evse(user=None):
    if not user:
        return {"message": "Permission denied"}, 403
    
    data = request.json
    station_id = sanitize_input(data.get("station_id"))

    if user["role"] == "owner":
        owner_id = user["user_id"]
        owned_stations = fetch_data(f"SELECT station_id FROM evses_joined WHERE owner_id = {owner_id}")
        if not owned_stations or station_id not in [station["id"] for station in owned_stations]:
            return {"message": "Permission denied"}, 403

    query = f"INSERT INTO EVSE (station_id, evse_number, connector_type, price, charge_level) VALUES ({station_id}, '{sanitize_input(data['evse_number'])}', '{sanitize_input(data['connector_type'])}', {sanitize_input(data['price'])}, {sanitize_input(data['charge_level'])})"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        evse_id = cursor.lastrowid
        sql_connection.commit()

    return {"message": "EVSE created successfully", "id": evse_id}, 201

# update evse
@app.route("/api/sql/evses/<int:evse_id>", methods=["PATCH"])
@require_permission("owner", "staff")
def update_evse(evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403
    
    data = request.json

    if user["role"] == "owner":
        evse_id = sanitize_input(evse_id)
        query = f"SELECT owner_id FROM evses_joined WHERE evse_id = {evse_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = "UPDATE EVSE SET "
    for key, value in data.items():
        query += f"{key} = '{sanitize_input(value)}', "
    query = query[:-2]
    query += f" WHERE id = {evse_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "EVSE updated successfully", "id": evse_id}, 200

# delete evse
@app.route("/api/sql/evses/<int:evse_id>", methods=["DELETE"])
@require_permission("owner", "staff")
def delete_evse(evse_id, user=None):
    if not user:
        return {"message": "Permission denied"}, 403
    
    if user["role"] == "owner":
        evse_id = sanitize_input(evse_id)
        query = f"SELECT owner_id FROM evses_joined WHERE evse_id = {evse_id}"
        sql_connection = mysql_pool.connection()
        with sql_connection.cursor() as cursor:
            cursor.execute(query)
            owner_id = cursor.fetchone()
        
        if not owner_id or owner_id[0] != user["user_id"]:
            return {"message": "Permission denied"}, 403

    query = f"DELETE FROM EVSE WHERE id = {evse_id}"

    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        sql_connection.commit()

    return {"message": "EVSE deleted successfully", "id": evse_id}, 200

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)