from flask import Flask, json, jsonify, request, Response
import pymongo
import pymysql
import os
from dotenv import load_dotenv
from bson import json_util

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
sql_connection = pymysql.connect(host=sql_host,
                             user=sql_user,
                             password=sql_pw,
                             database=sql_db,
                             cursorclass=pymysql.cursors.DictCursor)

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
    with sql_connection.cursor() as cursor:
        cursor.execute("SELECT * FROM Site")  # Replace with your query
        data = cursor.fetchone()
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
