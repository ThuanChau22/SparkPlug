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


def get_stations(connection, filter={}, select={}, sort={}, limit=None, cursor=None):
    query_values = []
    field_list = get_fields(connection, Table.StationView.value)

    query = select_fields(select, field_list)

    search_fields = ["site_name", "street_address", "city"]
    search_term = filter.get("search")
    query = select_search(query, query_values, search_fields, search_term, field_list)

    lat_lng_origin = filter.get("lat_lng_origin")
    query = select_distance(query, query_values, lat_lng_origin, field_list)

    query = f"{query} FROM {Table.StationView.value}"

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

    with connection.cursor() as cursor:
        cursor.execute(query, query_values)
        stations = cursor.fetchall()

    return {
        "data": stations or [],
        "cursor": create_cursor(stations, sort, limit),
    }


def get_station_by_id(connection, station_id):
    return fetch_by_id(connection, Table.StationView.value, station_id)


def create_station(connection, station_data):
    query = f"""
        INSERT INTO {Table.Station.value} (
          name, site_id, latitude, longitude
        ) VALUES (%s, %s, %s, %s)
    """
    values = (
        station_data.get("name"),
        station_data.get("site_id"),
        station_data.get("latitude"),
        station_data.get("longitude"),
    )
    with connection.cursor() as cursor:
        cursor.execute(query, values)
        station_id = cursor.lastrowid
    return station_id


def update_station(connection, station_id, station_data):
    query = f"UPDATE {Table.Station.value} SET"

    field_set = set(get_fields(connection, Table.Station.value))
    update_values = []
    for field, value in station_data.items():
        if field in field_set:
            separator = "" if not update_values else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if not update_values:
        return False

    query += f" WHERE id = %s"
    update_values.append(station_id)

    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, update_values)
    return affected_rows


def delete_station(connection, station_id):
    query = f"DELETE FROM {Table.Station.value} WHERE id = %s"
    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, station_id)
    return affected_rows
