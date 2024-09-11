import os
import dotenv
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
WEB_DOMAIN = os.environ["WEB_DOMAIN"]
AUTH_API_ENDPOINT = os.environ["AUTH_API_ENDPOINT"]
MYSQL_URI = os.environ["MYSQL_URI"]
GEOIP_ACCOUNT_ID = os.environ["GEOIP_ACCOUNT_ID"]
GEOIP_LICENSE_KEY = os.environ["GEOIP_LICENSE_KEY"]

# MySQL Configuration
mysql_credential = make_url(MYSQL_URI)
mysql = PooledDB(
    creator=pymysql,
    cursorclass=pymysql.cursors.DictCursor,
    maxconnections=100,
    host=mysql_credential.host,
    port=mysql_credential.port,
    user=mysql_credential.username,
    password=mysql_credential.password,
    database=mysql_credential.database,
)
