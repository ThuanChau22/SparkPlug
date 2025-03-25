from src.repositories.utils import (
    Table,
    get_fields,
    fetch_by_id,
    select_fields,
    select_search,
    select_distance,
    where_fields_equal,
    where_search_match,
    where_lat_lng_range,
    having_cursor_at,
    sort_by_fields,
    limit_at,
    create_cursor,
)


def get_sites(connection, filter={}, select={}, sort={}, limit=None, cursor=None):
    query_values = []
    field_list = get_fields(connection, Table.Site.value)

    query = select_fields(select, field_list)

    search_fields = ["name", "street_address", "city"]
    search_term = filter.get("search")
    query = select_search(query, query_values, search_fields, search_term, field_list)

    lat_lng_origin = filter.get("lat_lng_origin")
    query = select_distance(query, query_values, lat_lng_origin, field_list)

    query = f"{query} FROM {Table.Site.value}"

    query = where_fields_equal(query, query_values, filter, field_list)

    query = where_search_match(query, query_values, search_fields, search_term)

    query = where_lat_lng_range(
        query,
        query_values,
        filter.get("lat_lng_min"),
        filter.get("lat_lng_max"),
    )

    query = having_cursor_at(query, query_values, sort, cursor)

    query = sort_by_fields(query, sort, field_list)

    query = limit_at(query, limit)

    with connection.cursor() as conn_cursor:
        conn_cursor.execute(query, query_values)
        sites = conn_cursor.fetchall()

    return {
        "sites": sites or [],
        "cursor": create_cursor(sites, sort, limit),
    }


def get_site_locations(connection, location={}, limit=None):
    field = ""
    value = ""

    location_fields = [
        "street_address",
        "city",
        "state",
        "country",
        "zip_code",
    ]
    for location_field in location_fields:
        if location.get(location_field):
            field = location_field
            value = location.get(location_field)
            break

    if not field or not value:
        return []

    query = f"SELECT DISTINCT {field} FROM {Table.Site.value}"
    query = f"{query} WHERE {field} LIKE %s"
    query = sort_by_fields(query, {f"{field}": 1}, location_fields)
    query = limit_at(query, limit)
    query_values = f"{value}%"

    with connection.cursor() as cursor:
        cursor.execute(query, query_values)
        locations = cursor.fetchall()

    return [entry.get(field) for entry in locations]


def get_site_by_id(connection, site_id):
    return fetch_by_id(connection, Table.Site.value, site_id)


def create_site(connection, site_data):
    query = f"""
        INSERT INTO {Table.Site.value} (
          name, owner_id, latitude, longitude,
          street_address, city, state, zip_code, country
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        site_data.get("name"),
        site_data.get("owner_id"),
        site_data.get("latitude"),
        site_data.get("longitude"),
        site_data.get("street_address"),
        site_data.get("city"),
        site_data.get("state"),
        site_data.get("zip_code"),
        site_data.get("country"),
    )
    with connection.cursor() as cursor:
        cursor.execute(query, values)
        site_id = cursor.lastrowid
    return site_id


def update_site(connection, site_id, site_data):
    query = f"UPDATE {Table.Site.value} SET"

    field_set = set(get_fields(connection, Table.Site.value))
    update_values = []
    for field, value in site_data.items():
        if field in field_set:
            separator = "" if not update_values else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if not update_values:
        return False

    query += f" WHERE id = %s"
    update_values.append(site_id)

    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, update_values)
    return affected_rows


def delete_site(connection, site_id):
    query = f"DELETE FROM {Table.Site.value} WHERE id = %s"
    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, site_id)
    return affected_rows
