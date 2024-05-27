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
mongo_connection = pymongo.MongoClient(MONGODB_URL)