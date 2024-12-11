import os
import dotenv
import pymongo

# Load environment variables
dotenv.load_dotenv(dotenv_path=".env")
PORT = os.getenv("PORT")
WEB_DOMAIN = os.getenv("WEB_DOMAIN") or "*"
MONGODB_URI = os.environ["MONGODB_URI"]
AUTH_API_ENDPOINT = os.environ["AUTH_API_ENDPOINT"]
STATION_API_ENDPOINT = os.environ["STATION_API_ENDPOINT"]
STATION_PREDICTION_MODEL_PATH = os.environ["STATION_PREDICTION_MODEL_PATH"]
WAIT_TIME_MODEL_PATH = os.environ["WAIT_TIME_MODEL_PATH"]

# MongoDB Configuration
MONGODB_DATABASE = pymongo.uri_parser.parse_uri(MONGODB_URI)["database"]
mongo = pymongo.MongoClient(MONGODB_URI)[MONGODB_DATABASE]
