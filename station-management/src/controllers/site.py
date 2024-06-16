import requests
from flask import request

# Internal Modules
from src.config import SQL_API_ENDPOINT
from src import utils


def read_sites():
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/sites",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    sites = response.json()
    sites = utils.convert_coords_to_float_sites(sites)

    return sites


def read_site_by_id(site_id):
    args = request.args.to_dict()
    if request.auth["role"] == "owner":
        args["owner_id"] = request.auth["user_id"]

    response = requests.get(
        url=f"{SQL_API_ENDPOINT}/sites/{site_id}",
        params=args,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    sites = response.json()
    sites = utils.convert_coords_to_float_sites(sites)

    return sites[0]


def create_site():
    data = request.json
    if request.auth["role"] == "owner":
        data["owner_id"] = request.auth["user_id"]

    response = requests.post(
        url=f"{SQL_API_ENDPOINT}/sites",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def update_site(site_id):
    data = request.json

    response = requests.patch(
        url=f"{SQL_API_ENDPOINT}/sites/{site_id}",
        json=data,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()


def delete_site(site_id):
    response = requests.delete(
        url=f"{SQL_API_ENDPOINT}/sites/{site_id}",
        headers={"Authorization": request.headers.get("Authorization")},
    )

    return response.json()
