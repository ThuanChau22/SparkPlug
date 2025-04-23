import os
import dotenv
import pymongo
import pymysql
from dbutils.pooled_db import PooledDB
from sqlalchemy.engine.url import make_url

# Load environment variables
env = os.environ.get("ENV", "prod")
if env == "dev":
    dotenv_path = ".env.dev"
else:
    dotenv_path = ".env"
dotenv.load_dotenv(dotenv_path=dotenv_path)
PORT = os.environ["PORT"]
WEB_DOMAINS = os.environ["WEB_DOMAINS"].split(",") or "*"
AUTH_API = os.environ["AUTH_API"]
ENERGY_FORECAST_MODEL_PATH = os.environ["ENERGY_FORECAST_MODEL_PATH"]

# MySQL Configuration
MYSQL_URI = os.environ["MYSQL_URI"]
mysql_credential = make_url(MYSQL_URI)
mysql_pool = PooledDB(
    creator=pymysql,
    cursorclass=pymysql.cursors.DictCursor,
    maxconnections=100,
    host=mysql_credential.host,
    port=mysql_credential.port,
    user=mysql_credential.username,
    password=mysql_credential.password,
    database=mysql_credential.database,
)

# MongoDB Configuration
MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DATABASE = pymongo.uri_parser.parse_uri(MONGODB_URI)["database"]
mongo = pymongo.MongoClient(MONGODB_URI)[MONGODB_DATABASE]
