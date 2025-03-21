from flask import request
from pymysql import IntegrityError

# Internal Modules
from src.controllers.utils import (
    extract_args_search,
    extract_args_lat_lng,
    extract_args_select,
    extract_args_sort_by,
)
from src.repositories import site
from src.repositories import station
from src.repositories.utils import transaction
from src.utils import handle_error


def get_stations():
    def session(connection):
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]
        filter.update(extract_args_search(filter))
        filter.update(extract_args_lat_lng(filter))
        select = extract_args_select(filter.get("fields"))
        sort = extract_args_sort_by(filter.get("sort_by"))
        limit = int(filter.get("limit") or 0) or None
        cursor = filter.get("cursor")
        return station.get_stations(connection, filter, select, sort, limit, cursor)

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

        site_data = site.get_site_by_id(connection, body["site_id"])
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
    except IntegrityError as e:
        if e.args[0] == 1451:
            e = Exception("Station contains one or more EVSEs", 409)
        return handle_error(e)
    except Exception as e:
        return handle_error(e)
