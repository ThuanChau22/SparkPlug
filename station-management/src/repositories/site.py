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

    search_fields = [
        "country",
        "state",
        "city",
        "zip_code",
        "street_address",
        "name",
    ]
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
        "data": sites or [],
        "cursor": create_cursor(sites, sort, limit),
    }


def get_site_location_autocomplete(connection, filter={}, limit=None):
    select_fields = []
    query_values = []

    search_field_dict = {
        "country": {"country"},
        "state": {"state", "country"},
        "city": {"city", "state", "country"},
        "zip_code": {"city", "state", "zip_code", "country"},
        "street_address": {"street_address", "city", "state", "country"},
        "name": {"name", "street_address", "city", "state", "country"},
    }

    def select_distinct(field, value, select_set):
        select = []
        for select_field in search_field_dict:
            if select_field not in select_set:
                select_field = f"NULL as {select_field}"
            select.append(select_field)
        select = ", ".join(select)
        statement = f"SELECT DISTINCT {select} FROM {Table.Site.value}"
        statement = f"{statement} WHERE {field} LIKE %s ORDER BY {field}"
        select_fields.append(field)
        query_values.append(value)
        return statement

    query = ""
    for field in search_field_dict:
        if not filter.get(field):
            continue
        value = f"{'%'if field == 'name' else ''}{filter.get(field)}%"
        select_set = search_field_dict.get(field)
        statement = select_distinct(field, value, select_set)
        query = f"{query}{' UNION ALL ' if query else ''}({statement})"
    if not query:
        return []

    select = ", ".join(select_fields)
    query = f"SELECT DISTINCT {select} FROM ({query}) as locations"
    query = limit_at(query, limit)

    with connection.cursor() as cursor:
        cursor.execute(query, query_values)
        locations = cursor.fetchall()

    return locations or []


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
