from flask import request

# Internal Modules
from src.repositories import site
from src.repositories import station
from src.repositories.utils import transaction
from src.utils import handle_error


def get_stations():
    def session(connection):
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]
        limit = filter.get("limit")
        limit = int(limit) if limit else None
        return station.get_stations(connection, filter, limit=limit)

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def get_station_by_id(station_id):
    def session(connection):
        station_data = station.get_station_by_id(connection, station_id)
        if not station_data:
            raise Exception("Station not found", 404)
        if (
            request.auth["role"] == "owner"
            and request.auth["user_id"] != station_data["owner_id"]
        ):
            raise Exception("Access denied", 403)
        return station_data

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def create_station():
    def session(connection):
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

        site_data = site.get_site_by_id(body["site_id"])
        if not site_data:
            raise Exception("Site not found", 404)
        if (
            request.auth["role"] == "owner"
            and request.auth["user_id"] != site_data["owner_id"]
        ):
            raise Exception("Access denied", 403)

        station_id = station.create_station(connection, body)
        return station.get_station_by_id(connection, station_id)

    try:
        return transaction(session, modify=True), 201
    except Exception as e:
        return handle_error(e)


def update_station(station_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        station_data = station.get_station_by_id(connection, station_id)
        if not station_data:
            raise Exception("Station not found", 404)
        if is_owner and user_id != station_data["owner_id"]:
            raise Exception("Access denied", 403)

        body = request.json
        if body.get("site_id"):
            del body["site_id"]
        if not station.update_station(connection, station_id, body):
            raise Exception("Station not updated", 400)
        return station.get_station_by_id(connection, station_id)

    try:
        return transaction(session, modify=True), 200
    except Exception as e:
        return handle_error(e)


def delete_station(station_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        station_data = station.get_station_by_id(connection, station_id)
        if not station_data:
            raise Exception("Station not found", 404)
        if is_owner and user_id != station_data["owner_id"]:
            raise Exception("Access denied", 403)
        if not station.delete_station(connection, station_id):
            raise Exception("Station not deleted", 400)
        return {}

    try:
        return transaction(session, modify=True), 204
    except Exception as e:
        return handle_error(e)
