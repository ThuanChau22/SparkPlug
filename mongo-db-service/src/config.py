import os
import dotenv
import pymongo

# Load environment variables
env = os.environ.get("ENV", "prod")
if env == "dev":
    dotenv_path = ".env.dev"
else:
    dotenv_path = ".env"
dotenv.load_dotenv(dotenv_path=dotenv_path)
PORT = os.environ["PORT"]
WEB_DOMAIN = os.environ["WEB_DOMAIN"]
MONGODB_URL = os.environ["MONGODB_URL"]
AUTH_API_ENDPOINT = os.environ["AUTH_API_ENDPOINT"]

# MongoDB Configuration
MONGODB_DATABASE = pymongo.uri_parser.parse_uri(MONGODB_URL)["database"]
# Debug print statement for MONGODB_DATABASE
'''
print(f"MONGODB_URL: {MONGODB_URL} MONGODB_DATABASE: {MONGODB_DATABASE} (type: {type(MONGODB_DATABASE)})")

if MONGODB_DATABASE is None:
    raise ValueError("MONGODB_DATABASE environment variable is not set or parsed correctly")
if not isinstance(MONGODB_DATABASE, str):
    raise TypeError("MONGODB_DATABASE must be an instance of str")
'''

mongo_connection = pymongo.MongoClient(MONGODB_URL)[MONGODB_DATABASE]
import sys
print(f"Connected to MongoDB database: {MONGODB_DATABASE}", file=sys.stderr)
print(f"Connected to MongoDB database: {MONGODB_URL}", file=sys.stderr)