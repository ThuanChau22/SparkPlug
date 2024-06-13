import requests
from flask import request

# Internal Modules
from src.config import SQL_API_ENDPOINT
from src import utils


def read_evses():
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/evses",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    evses = response.json()
    evses = utils.convert_coords_to_float_stations(evses)

    return evses


def read_evse_by_id(evse_id):
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]
    jwt = request.headers.get("Authorization")

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/evses/{evse_id}",
        params=args,
        headers={"Authorization": jwt},
    )

    evses = response.json()
    evses = utils.convert_coords_to_float_stations(evses)
    return evses[0]


def create_evse():
    data = request.json

    response = requests.post(
        url=f"{SQL_API_ENDPOINT}/evses",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def update_evse(evse_id):
    data = request.json

    response = requests.patch(
        url=f"{SQL_API_ENDPOINT}/evses/{evse_id}",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


# def update_evse_status(evse_id):
#     data = request.json

#     # Data for Mongo API endpoint
#     mongo_data = {
#         "evse_id": evse_id,
#         "evse_number": data.get("evse_number"),
#         "station_id": data.get("station_id"),
#         "new_status": data.get("status"),
#     }

#     response = requests.post(
#         url=f"{MONGO_API_ENDPOINT}/evse_status",
#         json=mongo_data,
#         headers={"Authorization": request.headers.get("Authorization")},
#     )

#     return response.json()


def delete_evse(evse_id):
    response = requests.delete(
        url=f"{SQL_API_ENDPOINT}/evses/{evse_id}",
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()
