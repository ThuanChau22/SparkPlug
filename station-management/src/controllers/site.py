from flask import request

# Internal Modules
from src.controllers.utils import (
    extract_args_lat_lng,
    extract_args_select,
    extract_args_sort_by,
)
from src.repositories import site
from src.repositories.utils import transaction
from src.utils import handle_error


def get_sites():
    def session(connection):
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]
        filter.update(extract_args_lat_lng(filter))
        select = extract_args_select(filter.get("fields"))
        sort = extract_args_sort_by(filter.get("sort_by"))
        limit = int(filter.get("limit") or 0) or None
        cursor = filter.get("cursor")
        return site.get_sites(connection, filter, select, sort, limit, cursor)

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def get_site_by_id(site_id):
    def session(connection):
        site_data = site.get_site_by_id(connection, site_id)
        if not site_data:
            raise Exception("Site not found", 404)
        if (
            request.auth["role"] == "owner"
            and request.auth["user_id"] != site_data["owner_id"]
        ):
            raise Exception("Access denied", 403)
        return site_data

    try:
        return transaction(session), 200
    except Exception as e:
        return handle_error(e)


def create_site():
    def session(connection):
        body = request.json

        if request.auth["role"] == "owner":
            body["owner_id"] = request.auth["user_id"]

        required_fields = (
            "name",
            "owner_id",
            "latitude",
            "longitude",
            "street_address",
            "city",
            "state",
            "zip_code",
            "country",
        )
        for field in required_fields:
            if not body.get(field):
                raise Exception(f"{field} is required", 400)

        site_id = site.create_site(connection, body)
        return site.get_site_by_id(connection, site_id)

    try:
        return transaction(session, modify=True), 201
    except Exception as e:
        return handle_error(e)


def update_site(site_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        site_data = site.get_site_by_id(connection, site_id)
        if not site_data:
            raise Exception("Site not found", 404)
        if is_owner and user_id != site_data["owner_id"]:
            raise Exception("Access denied", 403)

        body = request.json
        if is_owner and body.get("owner_id"):
            del body["owner_id"]

        if not site.update_site(connection, site_id, body):
            raise Exception("Site not updated", 400)
        return site.get_site_by_id(connection, site_id)

    try:
        return transaction(session, modify=True), 200
    except Exception as e:
        return handle_error(e)


def delete_site(site_id):
    def session(connection):
        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        site_data = site.get_site_by_id(connection, site_id)
        if not site_data:
            raise Exception("Site not found", 404)
        if is_owner and user_id != site_data["owner_id"]:
            raise Exception("Access denied", 403)
        if not site.delete_site(connection, site_id):
            raise Exception("Site not deleted", 400)
        return {}

    try:
        return transaction(session, modify=True), 204
    except Exception as e:
        return handle_error(e)
