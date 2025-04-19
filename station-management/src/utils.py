from enum import Enum
from sys import stderr
from base64 import (
    urlsafe_b64encode,
    urlsafe_b64decode,
)
from flask import request
from geoip2.errors import GeoIP2Error
import json
import traceback

# Internal Modules
from src.config import geo_client


class Constants(Enum):
    Lat_lng_origin = "36,-119"
    Lat_lng_delta = 0.125


def get_client_ip_address():
    default = request.remote_addr
    return request.environ.get("HTTP_X_FORWARDED_FOR", default)


def get_geo_data(ip_address):
    for param in [ip_address, "me"]:
        try:
            data = geo_client.city(param)
            return {
                "city": data.city.name,
                "zip_code": data.postal.code,
                "latitude": data.location.latitude,
                "longitude": data.location.longitude,
            }
        except GeoIP2Error:
            continue
    return {}


def urlsafe_b64_json_encode(payload):
    return urlsafe_b64encode(json.dumps(payload).encode()).decode()


def urlsafe_b64_json_decode(payload):
    return json.loads(urlsafe_b64decode(payload).decode())


def handle_error(error):
    try:
        if not (
            len(error.args) == 2
            and isinstance(error.args[0], str)
            and isinstance(error.args[1], int)
        ):
            raise error
        message, status_code = error.args
        if status_code >= 500:
            raise Exception(message)
        print(f"ClientError: {error}", file=stderr)
        return {"message": message}, status_code
    except Exception as error:
        print(f"ServerError: {error}", file=stderr)
        print(traceback.format_exc())
        message = "An unknown error occurred"
        return {"message": message}, 500
