from flask import Flask, json, jsonify, request, Response
import pymongo
import pymysql
import os
from dotenv import load_dotenv
from bson import json_util

# For authentication
from functools import wraps

# Set up dummy user to simulate login
DUMMY_USER = {
    "user_id": "10",
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


# Load environment variables
load_dotenv()

mongo_uri = os.environ['L_MONGO_URI']

sql_host = os.environ['L_SQL_HOST']
sql_user = os.environ['L_SQL_USER']
sql_pw = os.environ['L_SQL_PW']
sql_db = os.environ['L_SQL_DB']


app = Flask(__name__)

# MongoDB Configuration
mongo_client = pymongo.MongoClient(mongo_uri)
db = mongo_client['sparkplug']

# pymongo version
#connection_uri = mongo_uri
#mongo_client = pymongo.MongoClient(connection_uri)

# MySQL Configuration
def get_mysql_connection():
    connection = pymysql.connect(
        host=sql_host, 
        user=sql_user, 
        password=sql_pw, 
        atabase=sql_db, c
        ursorclass=pymysql.cursors.DictCursor)
    return connection

"""
sql_connection = pymysql.connect(host=sql_host,
                             user=sql_user,
                             password=sql_pw,
                             database=sql_db,
                             cursorclass=pymysql.cursors.DictCursor)

"""

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


@app.route('/api/site/', methods=['GET'])
@require_permission('owner', 'staff')
def get_sites(user):
    query = "SELECT * FROM Site JOIN Zip_Code ON Site.zip_code = Zip_Code.zip"
    conditions = ""

    q_state = request.args.get('state')
    q_city = request.args.get('city')
    q_zip = request.args.get('zip')
    q_owner = request.args.get('owner')
    q_name = request.args.get('name')
    q_id = request.args.get('id')

    if q_state:
        if conditions: conditions += " AND"
        conditions += f" state='{q_state}'"
    if q_city:
        if conditions: conditions += " AND"
        conditions += f" city='{q_city}'"
    if q_zip:
        if conditions: conditions += " AND"
        conditions += f" zip={q_zip}"
    if q_owner:
        if conditions: conditions += " AND"
        conditions += f" owner_id={q_owner}"
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
        data = cursor.fetchall()
    return jsonify(data)

@app.route('/api/site/add/', methods=[''])
@require_permission('owner', 'staff')
def add_site(user):
    
    pass

"""
/site
GET /
GET /?state =
GET /?city =
GET /?zip=
GET /?owner=
GET /?name=
GET /{id}
POST /
PUT /{id}
DEL /{id}

/station
GET /
GET/ ?state =
GET /?city =
GET /?zip=
GET /?prox=
GET /?owner=
GET /?name=
GET /?status=
GET /?siteID
GET /{id}
POST /
PUT /{id}
DEL /{id}
"""

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
