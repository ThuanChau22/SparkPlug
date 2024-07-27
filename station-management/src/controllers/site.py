from flask import request

# Internal Modules
from src.repositories import site
from src.utils import handle_error


def get_sites():
    try:
        filter = request.args.to_dict()
        if request.auth["role"] == "owner":
            filter["owner_id"] = request.auth["user_id"]

        limit = filter.get("limit")
        limit = int(limit) if limit else None

        data = site.get_sites(filter=filter, limit=limit)
        return data, 200
    except Exception as e:
        return handle_error(e)


def get_site_by_id(site_id):
    try:
        data = site.get_site_by_id(site_id)
        if not data:
            raise Exception("Site not found", 404)
        return data, 200
    except Exception as e:
        return handle_error(e)


def create_site():
    try:
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

        site_id = site.create_site(body)
        data = site.get_site_by_id(site_id)
        return data, 201
    except Exception as e:
        return handle_error(e)


def update_site(site_id):
    try:
        data = site.get_site_by_id(site_id)
        if not data:
            raise Exception("Site not found", 404)

        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        owner_id = data["owner_id"]
        if is_owner and user_id != owner_id:
            raise Exception("Access denied", 403)

        body = request.json
        if is_owner and body.get("owner_id"):
            del body["owner_id"]

        if not site.update_site(site_id, body):
            raise Exception("Update failed", 400)

        data = site.get_site_by_id(site_id)
        return data, 200
    except Exception as e:
        return handle_error(e)


def delete_site(site_id):
    try:
        data = site.get_site_by_id(site_id)
        if not data:
            raise Exception("Site not found", 404)

        is_owner = request.auth["role"] == "owner"
        user_id = request.auth["user_id"]
        owner_id = data["owner_id"]
        if is_owner and user_id != owner_id:
            raise Exception("Access denied", 403)

        if not site.delete_site(site_id):
            raise Exception("Delete failed", 400)

        return {}, 204
    except Exception as e:
        return handle_error(e)
