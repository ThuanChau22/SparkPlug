import requests
from flask import request

# Internal Modules
from src.config import SQL_API_ENDPOINT
from src import utils


def get_evses():
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations/evses",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    evses = response.json()
    evses = utils.convert_coords_to_float(evses)
    evses = utils.convert_price_to_float(evses)
    return evses


def get_evses_by_station(station_id):
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]
    jwt = request.headers.get("Authorization")

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}/evses",
        params=args,
        headers={"Authorization": jwt},
    )

    evses = response.json()
    evses = utils.convert_coords_to_float(evses)
    evses = utils.convert_price_to_float(evses)
    return evses


def get_evse_by_id(station_id, evse_id):
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]
    jwt = request.headers.get("Authorization")

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}/evses/{evse_id}",
        params=args,
        headers={"Authorization": jwt},
    )

    evses = response.json()
    evses = utils.convert_coords_to_float(evses)
    evses = utils.convert_price_to_float(evses)
    return evses[0]


def create_evse(station_id):
    data = request.json

    response = requests.post(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}/evses",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def update_evse(station_id, evse_id):
    data = request.json

    response = requests.patch(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}/evses/{evse_id}",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def delete_evse(station_id, evse_id):
    response = requests.delete(
        url=f"{SQL_API_ENDPOINT}/stations/{station_id}/evses/{evse_id}",
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()
