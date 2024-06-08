import requests
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from urllib.parse import urljoin
from bson import ObjectId
import sys

# Internal Modules
from config import (
    PORT,
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    mongo_connection as db,
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

# Process Mongo Date
def date_to_milliseconds(date_str, date_format="%m/%d/%Y"):
    try:
        dt = datetime.strptime(date_str, date_format)
        epoch = datetime.utcfromtimestamp(0)  # Unix epoch start time
        return int((dt - epoch).total_seconds() * 1000)
    except ValueError:
        # Handle the exception if the date_str format is incorrect
        return None

def iso_to_milliseconds(iso_date):
    """
    Converts an ISO formatted date string to the number of milliseconds since the Unix epoch.
    :param iso_date: The ISO formatted date string.
    :return: The number of milliseconds since the Unix epoch.
    """
    # Convert the ISO formatted date string to a datetime object
    dt = datetime.fromisoformat(iso_date)

    # Convert the datetime object to the number of milliseconds since the Unix epoch
    epoch = datetime.utcfromtimestamp(0)
    milliseconds = (dt - epoch).total_seconds() * 1000.0

    return int(milliseconds)


def time_string_to_hours(time_str):
    try:
        hours, minutes, seconds = map(int, time_str.split(":"))
        return hours + minutes / 60 + seconds / 3600
    except ValueError:
        return 0  # Return 0 if the time format is incorrect

# Database actions
def insert_transaction(transaction):
    """
    Inserts a transaction into the database.
    :param transaction: The transaction to be inserted.
    :return: The ID of the inserted transaction.
    """
    collection = db['charging_sessions']
    result = collection.insert_one(transaction)
    return str(result.inserted_id)

def fetch_transactions(query_in):
    """
    Fetches transactions from the database based on a query.
    :param query: The query parameters.
    :return: A list of transactions.
    """
    query_out = {}

    if "station_id" in query_in:
        # Convert the station_id parameter to a list of integers
        station_ids = [int(id) for id in query_in["station_id"].split(",")]
        query_out["station_id"] = {"$in": station_ids}
    
    if "charge_level" in query_in:
        charge_level_map = {"1": "Level 1", "2": "Level 2"}
        charge_levels = [
            charge_level_map[level]
            for level in query_in["charge_level"].split()
            if level in charge_level_map
        ]
        if charge_levels:
            query_out["charge_level"] = {"$in": charge_levels}

    # Flter transactions by date range
    if "start_date" not in query_in:
        query_in["start_date"] = "01/01/2010"
    if "end_date" not in query_in:
        query_in["end_date"] = datetime.now().strftime("%m/%d/%Y")
    
    start_ms = date_to_milliseconds(query_in["start_date"])
    end_ms = date_to_milliseconds(query_in["end_date"])
    query_out["transaction_date"] = {"$gte": start_ms, "$lte": end_ms}

    print(f"New Query: {query_out}", file=sys.stderr)

    transactions = db.charging_sessions.find(query_out)
    transactions_list = list(transactions)
    for transaction in transactions_list:
        transaction["_id"] = str(transaction["_id"])
    return transactions_list

def insert_evse_status_update(data):
    """
    Inserts an EVSE status update into the database.
    If a document with the same evse_id already exists, appends the new update to the updates list of that document.
    :param evse_status_update: The EVSE status update to be inserted.
    :return: The ID of the inserted or updated EVSE status update.
    """
    current_time = datetime.now().isoformat()

    evse_status_update_formatted = {
        "evse_id": int(data["evse_id"]),
        "station_id": int(data["station_id"]),
        "evse_number": int(data["evse_number"]),
        "updates": [
            {
                # Use the provided timestamp or the current time if it's not provided
                "timestamp": data.get("timestamp", iso_to_milliseconds(current_time)),
                "new_status": sanitize_input(data["new_status"])
            }
        ]
    }

    # Update the document with the given evse_id, or create it if it doesn't exist
    result = db.evse_status.update_one(
        {"evse_id": evse_status_update_formatted["evse_id"]},
        {"station_id": evse_status_update_formatted["station_id"]},
        {"evse_number": evse_status_update_formatted["evse_number"]},
        {"$push": {"updates": {"$each": evse_status_update_formatted["updates"]}}},
        upsert=True
    )

    # If a new document was created, return its ID
    if result.upserted_id is not None:
        return str(result.upserted_id)

    # If an existing document was updated, return its evse_id
    return evse_status_update_formatted["evse_id"]

def fetch_evse_status(query_in):
    """
    Fetches EVSE status updates from the database based on a query.
    :param query: The query parameters.
    :return: A list of EVSE status updates.
    """
    query_out = {}

    if "evse_id" in query_in:
        # Convert the evse_id parameter to a list of integers
        evse_ids = [int(id) for id in query_in["evse_id"].split(",")]
        query_out["evse_id"] = {"$in": evse_ids}
    
    if "station_id" in query_in:
        # Convert the station_id parameter to a list of integers
        station_ids = [int(id) for id in query_in["station_id"].split(",")]
        query_out["station_id"] = {"$in": station_ids}

    print(f"New Query: {query_out}", file=sys.stderr)

    evse_status_updates = db.evse_status.find(query_out)
    evse_status_list = list(evse_status_updates)
    for evse_status in evse_status_list:
        evse_status["_id"] = str(evse_status["_id"])
    return evse_status_list

####################################################################################################
# Routes
####################################################################################################

# Test routes
@app.route("/api/mongo_test", methods=["GET"])
def test():
    return {"message": "Mongo DB Service is up and running!"}

@app.route("/api/db_test", methods=["GET"])
def db_test():
    try:
        # The server_info method is cheap and does not require auth.
        db.server_info()
        return jsonify({"message": "Mongo DB is connected!"}), 200
    except Exception as e:
        return jsonify({"message": "Cannot connect to Mongo DB", "error": str(e)}), 500

@app.route('/api/mongo/transactions/metadata', methods=['GET'])
def get_transactions_metadata():
    collection = db['transactions']
    count = collection.count_documents({})
    return jsonify({'count': count})

@app.route('/api/mongo/collections', methods=['GET'])
def get_collections():
    collections = db.list_collection_names()
    return jsonify({'collections': collections})

########## Transaction routes
@app.route("/api/mongo/transactions", methods=["GET"])
@require_permission("staff", "owner")
def get_transactions(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    # Get query parameters
    query_parameters = request.args
    query_in = {key: sanitize_input(value) for key, value in query_parameters.items()}

    print(f"Query Parameters: {query_in}", file=sys.stderr)

    return fetch_transactions(query_in)

@app.route("/api/mongo/transactions", methods=["POST"])
@require_permission("staff", "owner")
def post_transaction(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    # Get request data
    data = request.get_json()
    transaction = {
        "station_id": int(data["station_id"]),
        "evse_id": int(data["evse_id"]),
        "transaction_date": date_to_milliseconds(data["transaction_date"]),
        "start_time": (data["start_time"]),
        "end_time": (data["end_time"]),
        "charge_level": data["charge_level"],
        "kwh_delivered": float(data["kwh_delivered"]),
        "payment": float(data["payment"]),
    }

    print(f"Transaction: {transaction}", file=sys.stderr)

    return insert_transaction(transaction)

########## EVSE status update routes
@app.route("/api/mongo/evse_status", methods=["GET"])
@require_permission("staff", "owner")
def get_evse_status(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    # Get query parameters
    query_parameters = request.args
    query_in = {key: sanitize_input(value) for key, value in query_parameters.items()}

    print(f"Query Parameters: {query_in}", file=sys.stderr)

    return fetch_evse_status(query_in)

@app.route("/api/mongo/evse_status", methods=["POST"])
@require_permission("staff", "owner")
def post_evse_status(user=None):
    if not user:
        return {"message": "Permission denied"}, 403

    # Get request data
    data = request.get_json()

    # Pass the data to insert_evse_status_update
    result = insert_evse_status_update(data)

    return {"message": "EVSE status updated successfully", "id": result}, 200

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)