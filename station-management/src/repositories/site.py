from src.repositories.utils import (
    Table,
    get_fields,
    fetch_by_id,
    select_fields,
    select_distance,
    where_fields_equal,
    where_lat_lng_range,
    where_cursor_at,
    sort_by_fields,
    limit_at,
    create_cursor,
)


def get_sites(connection, filter={}, select={}, sort={}, limit=None, cursor=None):
    query_values = []
    field_list = get_fields(connection, Table.Site.value)
    query = select_fields(select, field_list)
    lat_lng_origin = filter.get("lat_lng_origin")
    query = select_distance(query, query_values, lat_lng_origin, field_list)
    query = f"{query} FROM {Table.Site.value}"
    query = where_fields_equal(query, query_values, filter, field_list)
    query = where_lat_lng_range(
        query,
        query_values,
        filter.get("lat_lng_min"),
        filter.get("lat_lng_max"),
    )
    query = where_cursor_at(query, query_values, sort, cursor, lat_lng_origin)
    query = sort_by_fields(query, sort, field_list)
    query = limit_at(query, limit)

    with connection.cursor() as conn_cursor:
        conn_cursor.execute(query, query_values)
        sites = conn_cursor.fetchall()

    return {
        "sites": sites or [],
        "cursor": create_cursor(sites, sort, limit),
    }


def get_site_by_id(connection, site_id):
    return fetch_by_id(connection, Table.Site.value, site_id) or None


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
    return affected_rows > 0 if affected_rows else False


def delete_site(connection, site_id):
    query = f"DELETE FROM {Table.Site.value} WHERE id = %s"
    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, site_id)
    return affected_rows > 0 if affected_rows else False
