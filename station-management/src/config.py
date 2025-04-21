import os
import dotenv
import pymysql
from dbutils.pooled_db import PooledDB
from geoip2 import webservice
from sqlalchemy.engine.url import make_url

from datetime import datetime

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
MYSQL_URI = os.environ["MYSQL_URI"]
GEOIP_ACCOUNT_ID = os.environ["GEOIP_ACCOUNT_ID"]
GEOIP_LICENSE_KEY = os.environ["GEOIP_LICENSE_KEY"]


def convert_datetime(x):
    x = pymysql.converters.convert_datetime(x)
    return x if isinstance(x, str) else x.isoformat()


# MySQL Configuration
conversions = pymysql.converters.conversions
conversions[pymysql.FIELD_TYPE.DATETIME] = convert_datetime
conversions[pymysql.FIELD_TYPE.DECIMAL] = lambda x: float(x)
conversions[pymysql.FIELD_TYPE.NEWDECIMAL] = lambda x: float(x)
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
    conv=conversions,
)

# GeoIP Configuration
geo_client = webservice.Client(
    GEOIP_ACCOUNT_ID,
    GEOIP_LICENSE_KEY,
    "geolite.info",
)
