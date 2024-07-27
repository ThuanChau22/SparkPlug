from flask import request

# Internal Modules
from src.repositories import site
from src.repositories import station
from src.utils import handle_error


def get_stations():
    try:
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]

        limit = filter.get("limit")
        limit = int(limit) if limit else None

        data = station.get_stations(filter=filter, limit=limit)
        return data, 200
    except Exception as e:
        return handle_error(e)


def get_station_by_id(station_id):
    try:
        data = station.get_station_by_id(station_id)
        if not data:
            raise Exception("Station not found", 404)
        return data, 200
    except Exception as e:
        return handle_error(e)


def create_station():
    try:
        body = request.json

        required_fields = (
            "name",
            "site_id",
            "latitude",
            "longitude",
        )
        for field in required_fields:
            if not body.get(field):
                raise Exception(f"{field} is required", 400)

        if request.auth["role"] == "owner":
            data = site.get_site_by_id(body["site_id"])
            if request.auth["user_id"] != data["owner_id"]:
                raise Exception("Access denied", 403)

        station_id = station.create_station(body)
        data = station.get_station_by_id(station_id)
        return data, 201
    except Exception as e:
        return handle_error(e)


def update_station(station_id):
    try:
        data = station.get_station_by_id(station_id)
        if not data:
            raise Exception("Station not found", 404)

        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        owner_id = data["owner_id"]
        if is_owner and user_id != owner_id:
            raise Exception("Access denied", 403)

        body = request.json
        if body.get("site_id"):
            del body["site_id"]

        if not station.update_station(station_id, body):
            raise Exception("Update failed", 400)

        data = station.get_station_by_id(station_id)
        return data, 200
    except Exception as e:
        return handle_error(e)


def delete_station(station_id):
    try:
        data = station.get_station_by_id(station_id)
        if not data:
            raise Exception("Station not found", 404)

        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        owner_id = data["owner_id"]
        if is_owner and user_id != owner_id:
            raise Exception("Access denied", 403)

        if not station.delete_station(station_id):
            raise Exception("Delete failed", 400)

        return {}, 204
    except Exception as e:
        return handle_error(e)
