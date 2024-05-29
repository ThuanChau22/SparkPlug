import os
import dotenv
import pymysql
import pymongo
from dbutils.pooled_db import PooledDB

# Load environment variables
env = os.environ.get("ENV", "prod")
if env == "dev":
    dotenv_path = ".env.dev"
else:
    dotenv_path = ".env"
dotenv.load_dotenv(dotenv_path=dotenv_path)
PORT = os.environ["PORT"]
WEB_DOMAIN = os.environ["WEB_DOMAIN"]
MYSQL_HOST = os.environ["MYSQL_HOST"]
MYSQL_PORT = os.environ["MYSQL_PORT"]
MYSQL_USER = os.environ["MYSQL_USER"]
MYSQL_PASS = os.environ["MYSQL_PASS"]
MYSQL_DATABASE = os.environ["MYSQL_DATABASE"]
MONGODB_URL = os.environ["MONGODB_URL"]
AUTH_API_ENDPOINT = os.environ["AUTH_API_ENDPOINT"]

# MySQL Configuration
mysql_pool = PooledDB(
    creator=pymysql,
    host=MYSQL_HOST,
    port=int(MYSQL_PORT),
    user=MYSQL_USER,
    password=MYSQL_PASS,
    database=MYSQL_DATABASE,
    cursorclass=pymysql.cursors.DictCursor,
    maxconnections=10,
)

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
