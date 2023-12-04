import os
from dotenv import load_dotenv

from flask import Flask, json, jsonify, request, Response
from flask_cors import CORS
from bson import json_util

import pymongo
import pymysql

app = Flask(__name__)
CORS(app)


# For authentication
from functools import wraps

# Set up dummy user to simulate login
DUMMY_USER = {
    "user_id": "10",
    "role": "staff", 
}

# Decorator for access control
def require_permission(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if DUMMY_USER['role'] not in allowed_roles:
                return {"message": "Permission denied"}, 403
            return f(*args, **kwargs, user=DUMMY_USER)
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

    sanitized_string = input_string.replace('\n', '').replace('\r', '')
    sanitized_string = sanitized_string.replace("'", "\\'").replace('"', '\\"')
    
    return sanitized_string


# Load environment variables
load_dotenv()

mongo_uri = os.environ['L_MONGO_URI']

sql_host = os.environ['L_SQL_HOST']
sql_user = os.environ['L_SQL_USER']
sql_pw = os.environ['L_SQL_PW']
sql_db = os.environ['L_SQL_DB']


# MongoDB Configuration
mongo_client = pymongo.MongoClient(mongo_uri)
db = mongo_client['sparkplug']



# MySQL Configuration
def get_mysql_connection():
    connection = pymysql.connect(
        host=sql_host, 
        user=sql_user, 
        password=sql_pw, 
        database=sql_db, 
        cursorclass=pymysql.cursors.DictCursor)
    return connection


# Endpoint functions
@app.route('/api/mongodb', methods=['GET'])
def get_mongo_data():

    document = db.transactions.find_one()
    # This step is necessary to convert ObjectID to string so Flask can recognize it
    if document: 
        document['_id'] = str(document['_id'])
    return jsonify(document)
    """
    return Response(
        json_util.dumps(document),
        mimetype='application/json'
    )
    """

@app.route('/api/mysqldb', methods=['GET'])
def get_mysql_data():
    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute("SELECT * FROM Site")  # Replace with your query
        data = cursor.fetchone()
    return jsonify(data)

# Site management
@app.route('/api/site', methods=['GET'])
@require_permission('owner', 'staff')
def get_sites(user):
    query = "SELECT * FROM Site JOIN Zip_Code ON Site.zip_code = Zip_Code.zip"
    conditions = ""

    q_state = request.args.get('state')
    q_city = request.args.get('city')
    q_zip = request.args.get('zip')
    q_owner_id = request.args.get('owner_id')
    q_name = request.args.get('name')
    q_id = request.args.get('id')

    if q_state:
        if conditions: conditions += " AND"
        conditions += f" state='{q_state}'"
    if q_city:
        if conditions: conditions += " AND"
        conditions += f" city LIKE '%{q_city}%'"
    if q_zip:
        if conditions: conditions += " AND"
        conditions += f" zip={q_zip}"
    if q_owner_id:
        if conditions: conditions += " AND"
        conditions += f" owner_id={q_owner_id}"
    if q_name:
        if conditions: conditions += " AND"
        conditions += f" name LIKE '%{q_name}%'"
    if q_id:
        if conditions: conditions += " AND"
        conditions = f" id={q_id}"

    if user['role'] == 'owner':
        if conditions: conditions += " AND"
        conditions += f" owner_id={user['user_id']}"

    if conditions:
        conditions = " WHERE" + conditions

    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query+conditions)
        data = cursor.fetchall()
    #return(query+conditions)
    return jsonify(data)

@app.route('/api/site/<site_id>', methods=['GET'])
@require_permission('owner', 'staff')
def get_one_site(user, site_id):
    query = f"SELECT * FROM Site JOIN Zip_Code ON Site.zip_code = Zip_Code.zip WHERE id={site_id}"

    if user['role'] == 'owner':
        query += f" AND owner_id={user['user_id']}"

    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchone()
    return jsonify(data)

@app.route('/api/site/add', methods=['POST'])
@require_permission('owner', 'staff')
def add_site(user):
    params = request.json

    owner_id = params.get('owner_id')
    latitude = params.get('latitude')
    longitude = params.get('longitude')
    name = params.get('name')
    street_address = params.get('street_address')
    zip_code = params.get('zip_code')

    if user['role'] == 'owner': owner_id = user['user_id']

    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            query = f"INSERT INTO Site (owner_id, latitude, longitude, name, street_address, zip_code) VALUES ({owner_id}, '{latitude}', '{longitude}', '{name}', '{street_address}', '{zip_code}')"
            cursor.execute(query)
            inserted_id = cursor.lastrowid
        sql_connection.commit()
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        sql_connection.close()

    return jsonify({'message': 'Site added successfully', 'inserted_id': inserted_id})

@app.route('/api/site/delete/<site_id>', methods=['DELETE'])
@require_permission('owner', 'staff')
def delete_site(user, site_id):
    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            # Prepare the SQL query to delete the site with the given ID
            query = f"DELETE FROM Site WHERE id={site_id}"
            # If the user is an owner, add an additional condition to delete only their sites
            if user['role'] == 'owner':
                query += f" AND owner_id={user['user_id']}"
            cursor.execute(query)
            # Check if any row is affected (means deletion happened)
            if cursor.rowcount == 0:
                return jsonify({'message': 'No site found with the given ID or you do not have permission to delete it'}), 404
        # Commit the changes to the database
        sql_connection.commit()
    except pymysql.MySQLError as e:
        # Return an error message if something goes wrong
        return jsonify({'error': str(e)}), 500
    finally:
        # Close the database connection
        sql_connection.close()

    # Return a success message
    return jsonify({'message': 'Site deleted successfully'})

@app.route('/api/site/update/<site_id>', methods=['PATCH'])
@require_permission('owner', 'staff')
def update_site(user, site_id):
    # Extract the data from the request body
    update_data = request.json

    # Check if there is data to update
    if not update_data:
        return jsonify({'message': 'No data provided for update'}), 400

    # Establish a connection to the MySQL database
    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            # Construct the SQL query dynamically based on the provided data
            update_query = ", ".join([f"{key}='{value}'" for key, value in update_data.items()])
            query = f"UPDATE Site SET {update_query} WHERE id={site_id}"
            # If the user is an owner, ensure they can only update their own sites
            if user['role'] == 'owner':
                query += f" AND owner_id={user['user_id']}"

            cursor.execute(query)
            # Check if any row is affected (means update happened)
            if cursor.rowcount == 0:
                return jsonify({'message': 'No site found with the given ID or you do not have permission to update it'}), 404

        # Commit the changes to the database
        sql_connection.commit()
    except pymysql.MySQLError as e:
        # Return an error message if something goes wrong
        return jsonify({'error': str(e)}), 500
    finally:
        # Close the database connection
        sql_connection.close()

    # Return a success message
    return jsonify({'message': 'Site updated successfully'})


# Station management
@app.route('/api/station', methods=['GET'])
@require_permission('owner', 'staff')
def get_stations(user):
    query = "SELECT * FROM stations_joined"
    conditions = ""

    q_state = request.args.get('state')
    q_city = request.args.get('city')
    q_zip = request.args.get('zip')
    q_owner_id = request.args.get('owner_id')
    q_name = request.args.get('name')
    q_id = request.args.get('id')
    q_status = request.args.get('status')
    q_site_id = request.args.get('site_id')

    if q_state:
        if conditions: conditions += " AND"
        conditions += f" state='{q_state}'"
    if q_city:
        if conditions: conditions += " AND"
        conditions += f" city LIKE '%{q_city}%'"
    if q_zip:
        if conditions: conditions += " AND"
        conditions += f" zip={q_zip}"
    if q_owner_id:
        if conditions: conditions += " AND"
        conditions += f" owner_id={q_owner_id}"
    if q_name:
        if conditions: conditions += " AND"
        conditions += f" name LIKE '%{q_name}%'"
    if q_id:
        if conditions: conditions += " AND"
        conditions = f" id={q_id}"
    if q_status:
        if conditions: conditions += " AND"
        conditions += f" status='{q_status}'"
    if q_site_id:
        if conditions: conditions += " AND"
        conditions += f" site_id={q_site_id}"

    if user['role'] == 'owner':
        if conditions: conditions += " AND"
        conditions += f" owner_id={user['user_id']}"

    if conditions:
        conditions = " WHERE" + conditions

    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query+conditions)
        data = cursor.fetchall()
    #return(query+conditions)
    return jsonify(data)

@app.route('/api/station/<station_id>', methods=['GET'])
@require_permission('owner', 'staff')
def get_one_station(user, station_id):
    query = f"SELECT * FROM stations_joined WHERE id={station_id}"

    if user['role'] == 'owner':
        query += f" AND owner_id={user['user_id']}"

    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchone()
    return jsonify(data)


@app.route('/api/station/add', methods=['POST'])
@require_permission('owner', 'staff')
def add_station(user):
    params = request.json

    name = sanitize_input(params.get('name'))
    charge_level = sanitize_input(params.get('charge_level'))
    connector_type = sanitize_input(params.get('connector_type'))
    latitude = sanitize_input(params.get('latitude'))
    longitude = sanitize_input(params.get('longitude'))
    site_id = sanitize_input(params.get('site_id'))

    if user['role'] == 'owner': owner_id = user['user_id']

    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            query = "INSERT INTO Station (name, charge_level, connector_type, latitude, longitude, site_id) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(query, (name, charge_level, connector_type, latitude, longitude, site_id))
            inserted_id = cursor.lastrowid
        sql_connection.commit()
    except pymysql.MySQLError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        sql_connection.close()

    return jsonify({'message': 'Station added successfully', 'inserted_id': inserted_id})

@app.route('/api/station/update/<station_id>', methods=['PATCH'])
@require_permission('owner', 'staff')
def update_station(user, station_id):
    # Extract the data from the request body
    update_data = request.json

    # Check if there is data to update
    if not update_data:
        return jsonify({'message': 'No data provided for update'}), 400

    # Establish a connection to the MySQL database
    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            # Construct the SQL query dynamically based on the provided data
            update_query = ", ".join([f"{key}='{value}'" for key, value in update_data.items()])
            query = f"UPDATE Station SET {update_query} WHERE id={station_id}"
            # If the user is an owner, ensure they can only update their own stations
            if user['role'] == 'owner':
                query += f" AND owner_id={user['user_id']}"

            cursor.execute(query)
            # Check if any row is affected (means update happened)
            if cursor.rowcount == 0:
                return jsonify({'message': 'No station found with the given ID'}), 404

        # Commit the changes to the database
        sql_connection.commit()
    except pymysql.MySQLError as e:
        # Return an error message if something goes wrong
        return jsonify({'error': str(e)}), 500
    finally:
        # Close the database connection
        sql_connection.close()

    # Return a success message
    return jsonify({'message': 'Station updated successfully'})

@app.route('/api/station/delete/<station_id>', methods=['DELETE'])
@require_permission('owner', 'staff')
def delete_station(user, station_id):
    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            # Prepare the SQL query to delete the station with the given ID
            query = f"DELETE FROM Station WHERE id={station_id}"
            # If the user is an owner, add an additional condition to delete only their stations
            if user['role'] == 'owner':
                query += f" AND owner_id={user['user_id']}"
            cursor.execute(query)
            # Check if any row is affected (means deletion happened)
            if cursor.rowcount == 0:
                return jsonify({'message': 'No station found with the given ID'}), 404
        # Commit the changes to the database
        sql_connection.commit()
    except pymysql.MySQLError as e:
        # Return an error message if something goes wrong
        return jsonify({'error': str(e)}), 500
    finally:
        # Close the database connection
        sql_connection.close()

    # Return a success message
    return jsonify({'message': 'Station deleted successfully'})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
