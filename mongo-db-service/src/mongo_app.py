import requests
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from urllib.parse import urljoin

# Internal Modules
from config import (
    PORT,
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    mongo_connection,
)


# Flash App
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": WEB_DOMAIN}})

db = mongo_connection["sparkplug"]

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
        mongo_connection.server_info()
        return jsonify({"message": "Mongo DB is connected!"}), 200
    except Exception as e:
        return jsonify({"message": "Cannot connect to Mongo DB", "error": str(e)}), 500

########## Transaction routes
@app.route("/api/mongo/transactions", methods=["GET"])
@require_permission("staff", "owner")
def get_transactions(user=None):
    if not user:
        return {"message": "Permission denied"}, 403
    
    transactions = db.transactions.find({})
    # Convert the results to a list and format
    transactions_list = list(transactions)
    import sys
    print(f"Number of transactions found: {len(transactions_list)}", file=sys.stderr)

    for transaction in transactions_list:
        transaction["_id"] = str(transaction["_id"])

    return transactions_list

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)