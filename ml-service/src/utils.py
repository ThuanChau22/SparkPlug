import requests
from flask import request
from sys import stderr

from src.config import mongo
from src.config import STATION_API


def get_charging_sessions_by_zip_code(zip_code):
    charging_sessions = mongo.charging_sessions.find({"postal_code": zip_code})
    return list(charging_sessions)


def get_stations_by_zip_code(zip_code):
    params = f"?zip_code={zip_code}"
    headers = request.headers
    response = requests.get(f"{STATION_API}{params}", headers=headers)
    data = response.json()
    if not response.status_code == 200:
        raise Exception(data, response.status_code)
    return data.get("data")


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
