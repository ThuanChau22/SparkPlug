import os
from dotenv import load_dotenv

from flask import Flask, json, jsonify, request, Response
from flask_cors import CORS
from bson import json_util, ObjectId

import pymongo
import pymysql

import datetime

import requests
from urllib.parse import urljoin
from collections import defaultdict


# For authentication
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


# Set up dummy user to simulate login
DUMMY_USER = {
    "user_id": "9",
    "role": "owner", 
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

# Process Mongo Date
def date_to_milliseconds(date_str, date_format='%m/%d/%Y'):
    try:
        dt = datetime.datetime.strptime(date_str, date_format)
        epoch = datetime.datetime.utcfromtimestamp(0)  # Unix epoch start time
        return int((dt - epoch).total_seconds() * 1000)
    except ValueError:
        # Handle the exception if the date_str format is incorrect
        return None

def time_string_to_hours(time_str):
    try:
        hours, minutes, seconds = map(int, time_str.split(':'))
        return hours + minutes / 60 + seconds / 3600
    except ValueError:
        return 0  # Return 0 if the time format is incorrect


# Chart data prep
def generate_charts(raw_docs):
    revenue_by_date = defaultdict(float)
    sessions_by_date = defaultdict(int)
    utilization_by_date = defaultdict(float)
    hour_counts = [0] * 24

    #return jsonify(raw_docs[0])

    for doc in raw_docs:
        mongo_timestamp = doc['transaction_date']
        timestamp_seconds = mongo_timestamp / 1000.0
        date = datetime.datetime.utcfromtimestamp(timestamp_seconds)

        # Revenue
        f_date = date.strftime('%Y-%m-%d')
        revenue_by_date[f_date] += doc['fee']
        sessions_by_date[f_date] += 1

        # Utilization Rate
        charging_time_hours = time_string_to_hours(doc['charging_time'])
        utilization_by_date[f_date] += charging_time_hours

        # Peak Time
        hour = date.hour
        hour_counts[hour] += 1


    # Calculate utilization rate as a percentage
    for date in utilization_by_date:
        utilization_by_date[date] = (utilization_by_date[date] / 24) * 100  # Convert to percentage


    sorted_dates = sorted(revenue_by_date.keys())
    rev_chart_data = {
        'labels': sorted_dates,
        'datasets': [{
            'label': 'Daily Revenue',
            'data': [revenue_by_date[date] for date in sorted_dates],
            'backgroundColor': 'rgba(75, 192, 192, 0.6)'
        }]
    }

    sessions_chart_data = {
        'labels': sorted_dates,
        'datasets': [{
            'label': 'Number of Sessions',
            'data': [sessions_by_date[date] for date in sorted_dates],
            'backgroundColor': 'rgba(255, 99, 132, 0.6)'
        }]
    }

    peak_chart_data = {
        'labels': [f"{i}:00 - {i+1}:00" for i in range(24)],
        'datasets': [{
            'label': 'Number of Transactions',
            'data': hour_counts
        }]
    }

    utilization_chart_data = {
        'labels': sorted_dates,
        'datasets': [{
            'label': 'Utilization Rate (%)',
            'data': [utilization_by_date[date] for date in sorted_dates],
            'backgroundColor': 'rgba(153, 102, 255, 0.6)'
        }]
    }


    data_pack = {
        'revenue': rev_chart_data,
        'sessions_count': sessions_chart_data,
        'utilization_rate': utilization_chart_data,
        'peak_time': peak_chart_data
    }

    return data_pack


def station_charts(station_id, start_date, end_date, charge_level):

    base_url = request.host_url  # Get the base URL of the current Flask app
    transactions_url = urljoin(base_url, f'api/transactions?station_id={station_id}')

    if start_date != None:
        transactions_url += f'&start_date={start_date}'
    if end_date != None:
        transactions_url += f'&end_date={end_date}'
    if charge_level != None:
        transactions_url += f'&charge_level={charge_level}'


    # Additional query parameters can be added as needed
    # Make the GET request
    response = requests.get(transactions_url)

    if response.status_code == 200:
        raw_docs = response.json()
        data_pack = generate_charts(raw_docs)
        
        return jsonify(data_pack)
    else:
        return jsonify([])


def aggregate_charts(site_id, start_date, end_date, charge_level):
    base_url = request.host_url.rstrip('/')
    stations_url = urljoin(base_url, 'api/stations')
    transactions_url = urljoin(base_url, 'api/transactions')

    # Constructing query parameters
    if site_id is not None:
        stations_url += f'?site_id={site_id}'

    query_params = {}
    if start_date is not None:
        query_params['start_date'] = start_date
    if end_date is not None:
        query_params['end_date'] = end_date
    if charge_level is not None:
        query_params['charge_level'] = charge_level

    # Fetching station IDs
    st_response = requests.get(stations_url)
    if st_response.status_code == 200:
        stations_data = st_response.json()  # Convert response to JSON
        stations = [doc['id'] for doc in stations_data]

        # Fetching transactions
        tr_response = requests.get(transactions_url, params=query_params)
        if tr_response.status_code == 200:
            transactions_data = tr_response.json()
            filtered_transactions = [tr for tr in transactions_data if tr['station_id'] in stations]

            # Generate and return chart data
            return jsonify(generate_charts(filtered_transactions))
        else:
            return jsonify({'error': 'Failed to fetch transactions'}), tr_response.status_code
    else:
        return jsonify({'error': 'Failed to fetch stations'}), st_response.status_code


# Load environment variables
env = os.environ.get('ENV', 'prod')
if env == 'dev':
    dotenv_path = '.env.dev'
else:
    dotenv_path = '.env'

load_dotenv(dotenv_path=dotenv_path)

mongo_uri = os.environ['MONGO_URI']

sql_host = os.environ['SQL_HOST']
sql_user = os.environ['SQL_USER']
sql_pw = os.environ['SQL_PW']
sql_db = os.environ['SQL_DB']


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
@app.route('/')
def hello():
    return "Hello World!"


@app.route('/api/1_trans', methods=['GET'])
def get_mongo_data():

    document = db.transactions.find_one()
    # This step is necessary to convert ObjectID to string so Flask can recognize it
    if document: 
        document['_id'] = str(document['_id'])
    return jsonify(document)

@app.route('/api/count-transactions', methods=['GET'])
def count_transactions():
    try:
        count = db.transactions.count_documents({})
        return jsonify({"document_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mysqldb', methods=['GET'])
def get_mysql_data():
    sql_connection = get_mysql_connection()
    with sql_connection.cursor() as cursor:
        cursor.execute("SELECT * FROM Site")  # Replace with your query
        data = cursor.fetchone()
    return jsonify(data)


@app.route('/api/transactions', methods=['GET'])
@require_permission('owner', 'staff')
def get_transactions(user):
    try:
        # Retrieve query parameters
        q_station_id = request.args.get('station_id', default=None, type=int)
        q_charge_level = request.args.get('charge_level', default=None)
        q_start_date = request.args.get('start_date', default='01/01/2010')
        q_end_date = request.args.get('end_date', default=datetime.datetime.now().strftime('%m/%d/%Y'))

        # Build query dynamically
        query = {}

        ## station id
        if q_station_id is not None:
            query['station_id'] = q_station_id

        ## charge level
        if q_charge_level is not None:
            # Map input values "1" or "2" to "Level 1" or "Level 2"
            charge_level_map = {'1': 'Level 1', '2': 'Level 2'}
            charge_levels = [charge_level_map[level] for level in q_charge_level.split() if level in charge_level_map]
            if charge_levels:
                query['charge_level'] = {'$in': charge_levels}

        ## date range
        ### Convert dates to milliseconds since Unix epoch
        start_ms = date_to_milliseconds(q_start_date)
        end_ms = date_to_milliseconds(q_end_date)
        ### Build date range query
        query['transaction_date'] = {'$gte': start_ms, '$lte': end_ms}

        # Query the MongoDB transactions collection
        transactions = db.transactions.find(query)
        
        # Convert the results to a list
        transactions_list = list(transactions)

        # Convert each MongoDB ObjectId to string
        for transaction in transactions_list:
            transaction['_id'] = str(transaction['_id'])

        return jsonify(transactions_list)

    except Exception as e:
        # Handle any exceptions that occur
        return jsonify({"error": str(e)}), 500


# Site management
@app.route('/api/sites', methods=['GET'])
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

@app.route('/api/sites/<site_id>', methods=['GET'])
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

@app.route('/api/sites', methods=['POST'])
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

@app.route('/api/sites/<site_id>', methods=['DELETE'])
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

@app.route('/api/sites/<site_id>', methods=['PATCH'])
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
@app.route('/api/stations', methods=['GET'])
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

@app.route('/api/stations/<station_id>', methods=['GET'])
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


@app.route('/api/stations', methods=['POST'])
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

@app.route('/api/stations/<station_id>', methods=['PATCH'])
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
            """
            if user['role'] == 'owner':
                query += f" AND owner_id={user['user_id']}"
            """

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

@app.route('/api/stations/<station_id>', methods=['DELETE'])
@require_permission('owner', 'staff')
def delete_station(user, station_id):
    sql_connection = get_mysql_connection()
    try:
        with sql_connection.cursor() as cursor:
            # Prepare the SQL query to delete the station with the given ID
            query = f"DELETE FROM Station WHERE id={station_id}"
            # If the user is an owner, add an additional condition to delete only their stations
            if user['role'] == 'owner':
                query = f"DELETE Station FROM Station JOIN Site ON Station.site_id - Site.id WHERE Station.id = {station_id} AND Site.owner_id = {user['user_id']}"
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

# Analytics
@app.route('/api/stations/analytics/<station_id>', methods=['GET'])
@require_permission('owner', 'staff')
def station_analytics(user, station_id):
    # Extract query parameters for date range (optional)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    charge_level = request.args.get('charge_level')

    if not start_date: start_date = '01/01/2010'
    if not end_date: end_date = datetime.datetime.now().strftime('%m/%d/%Y')
    if not charge_level: charge_level = None

    return station_charts(station_id, start_date, end_date, charge_level)

@app.route('/api/stations/analytics', methods=['GET'])
@require_permission('owner', 'staff')
def all_stations_analytics(user):
    # Extract query parameters for date range (optional)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    charge_level = request.args.get('charge_level')

    if not start_date: start_date = '01/01/2010'
    if not end_date: end_date = datetime.datetime.now().strftime('%m/%d/%Y')
    if not charge_level: charge_level = None

    return aggregate_charts(None, start_date, end_date, charge_level)

@app.route('/api/sites/analytics/<site_id>', methods=['GET'])
@require_permission('owner', 'staff')
def site_analytics(user, site_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    charge_level = request.args.get('charge_level')

    if not start_date: start_date = '01/01/2010'
    if not end_date: end_date = datetime.datetime.now().strftime('%m/%d/%Y')
    if not charge_level: charge_level = None

    return aggregate_charts(site_id, start_date, end_date, charge_level)


if __name__ == '__main__':
    app.run(host=os.environ['SERVER_HOST'], port=os.environ['SERVER_PORT'], debug=True)
