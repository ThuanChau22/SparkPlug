from sys import stderr
from geoip2 import webservice
from base64 import (
    urlsafe_b64encode,
    urlsafe_b64decode,
)
import json

# Internal Modules
from src.config import (
    GEOIP_ACCOUNT_ID,
    GEOIP_LICENSE_KEY,
)


def convert_coords_to_float(data):
    return [
        {
            **item,
            "latitude": float(item["latitude"]),
            "longitude": float(item["longitude"]),
        }
        for item in data
    ]


def convert_price_to_float(data):
    return [{**item, "price": float(item["price"])} for item in data]


def urlsafe_b64_json_encode(payload):
    return urlsafe_b64encode(json.dumps(payload).encode()).decode()


def urlsafe_b64_json_decode(payload):
    return json.loads(urlsafe_b64decode(payload).decode())


def get_geo_data(ip_address):
    account_id = GEOIP_ACCOUNT_ID
    license_key = GEOIP_LICENSE_KEY
    host = "geolite.info"
    with webservice.Client(account_id, license_key, host) as client:
        data = client.city(ip_address or "me")
    return {
        "city": data.city.name,
        "zip_code": data.postal.code,
        "latitude": data.location.latitude,
        "longitude": data.location.longitude,
    }


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
        message = "An unknown error occurred"
        return {"message": message}, 500
