from flask import request

# Internal Modules
from src.controllers.utils import (
    extract_args_lat_lng,
    extract_args_select,
    extract_args_sort_by,
)
from src.repositories import evse
from src.repositories import station
from src.repositories.utils import transaction
from src.utils import handle_error


def get_evses():
    def session(connection):
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]
        filter.update(extract_args_lat_lng(filter))
        select = extract_args_select(filter.get("fields"))
        sort = extract_args_sort_by(filter.get("sort_by"))
        limit = int(filter.get("limit") or 0) or None
        cursor = filter.get("cursor")
        return evse.get_evses(connection, filter, select, sort, limit, cursor)

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def get_evses_by_station(station_id):
    def session(connection):
        filter = {"station_id": station_id}
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]
        return evse.get_evses(connection, filter)

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def get_evse_by_id(station_id, evse_id):
    def session(connection):
        evse_data = evse.get_evse_by_ids(connection, station_id, evse_id)
        if not evse_data:
            raise Exception("Evse not found", 404)
        if (
            request.auth["role"] == "owner"
            and request.auth["user_id"] != evse_data["owner_id"]
        ):
            raise Exception("Access denied", 403)
        return evse_data

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def create_evse(station_id):
    def session(connection):
        body = request.json

        body["station_id"] = station_id
        required_fields = (
            "evse_id",
            "connector_type",
            "charge_level",
            "price",
        )
        for field in required_fields:
            if not body.get(field):
                raise Exception(f"{field} is required", 400)

        station_data = station.get_station_by_id(connection, station_id)
        if not station_data:
            raise Exception("Station not found", 404)
        if (
            request.auth["role"] == "owner"
            and request.auth["user_id"] != station_data["owner_id"]
        ):
            raise Exception("Access denied", 403)

        entry_id = evse.create_evse(connection, body)
        return evse.get_evse_by_id(connection, entry_id)

    try:
        return transaction(session, modify=True), 201
    except Exception as e:
        if isinstance(e.args[0], int) and e.args[0] == 1062:
            e = Exception("Evse duplicated", 409)
        return handle_error(e)


def update_evse(station_id, evse_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        evse_data = evse.get_evse_by_ids(connection, station_id, evse_id)
        if not evse_data:
            raise Exception("Evse not found", 404)
        if is_owner and user_id != evse_data["owner_id"]:
            raise Exception("Access denied", 403)

        body = request.json
        if body.get("station_id"):
            del body["station_id"]

        if not evse.update_evse(connection, station_id, evse_id, body):
            raise Exception("Evse not updated", 400)
        return evse.get_evse_by_ids(connection, station_id, evse_id)

    try:
        return transaction(session, modify=True), 200
    except Exception as e:
        if isinstance(e.args[0], int) and e.args[0] == 1062:
            e = Exception("Evse duplicated", 409)
        return handle_error(e)


def delete_evse(station_id, evse_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        evse_data = evse.get_evse_by_ids(connection, station_id, evse_id)
        if not evse_data:
            raise Exception("Evse not found", 404)
        if is_owner and user_id != evse_data["owner_id"]:
            raise Exception("Access denied", 403)

        if not evse.delete_evse(connection, station_id, evse_id):
            raise Exception("Evse not deleted", 400)
        return {}

    try:
        return transaction(session, modify=True), 204
    except Exception as e:
        return handle_error(e)
