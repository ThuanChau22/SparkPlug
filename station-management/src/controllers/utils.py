import re

# Internal Modules
from src.utils import (
    Constants,
    get_client_ip_address,
    get_geo_data,
)


def is_exclude(s):
    return re.search("^-(.*)+$", s)


def extract_args_lat_lng(args):
    lat_lng_data = {}
    if args.get("lat_lng_origin") == "default":
        client_ip_address = get_client_ip_address()
        geo_data = get_geo_data(client_ip_address)
        lat_origin, lng_origin = Constants.Lat_lng_origin.value.split(",")
        lat_origin = float(geo_data.get("latitude") or lat_origin)
        lng_origin = float(geo_data.get("longitude") or lng_origin)
        lat_lng_data["lat_lng_origin"] = f"{lat_origin},{lng_origin}"

        lat_lng_delta = Constants.Lat_lng_delta.value
        if not args.get("lat_lng_max"):
            lat_max = lat_origin + lat_lng_delta
            lng_max = lng_origin + lat_lng_delta
            lat_lng_data["lat_lng_max"] = f"{lat_max},{lng_max}"

        if not args.get("lat_lng_min"):
            lat_min = lat_origin - lat_lng_delta
            lng_min = lng_origin - lat_lng_delta
            lat_lng_data["lat_lng_min"] = f"{lat_min},{lng_min}"

    return lat_lng_data


def extract_args_select(fields):
    select = {}
    if fields:
        for field in fields.split(","):
            if is_exclude(field):
                select[field[1:]] = 0
            else:
                select[field] = 1
    return select


def extract_args_sort_by(field):
    sort = {"created_at": 1, "id": 1}
    if field:
        is_include = not is_exclude(field)
        field = field if is_include else field[1:]
        value = 1 if is_include else -1
        if field == "id":
            sort = {field: value}
        elif field == "created_at":
            sort[field] = value
        else:
            sort = {field: value, **sort}
    return sort