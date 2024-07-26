import requests
from flask import request

# Internal Modules
from src.config import SQL_API_ENDPOINT
from src import utils


def get_stations():
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    stations = response.json()
    stations = utils.convert_coords_to_float(stations)

    return stations


def get_station_by_id(station_id):
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    stations = response.json()
    stations = utils.convert_coords_to_float(stations)

    return stations[0]


def create_station():
    data = request.json

    response = requests.post(
        url=f"{SQL_API_ENDPOINT}/stations",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def update_station(station_id):
    data = request.json

    response = requests.patch(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def delete_station(station_id):
    response = requests.delete(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}",
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()
