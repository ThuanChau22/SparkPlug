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


def get_evses(connection, filter={}, select={}, sort={}, limit=None, cursor=None):
    query_values = []
    field_list = get_fields(connection, Table.EvseView.value)
    query = select_fields(select, field_list)
    lat_lng_origin = filter.get("lat_lng_origin")
    query = select_distance(query, query_values, lat_lng_origin, field_list)
    query = f"{query} FROM {Table.EvseView.value}"
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

    with connection.cursor() as cursor:
        cursor.execute(query, query_values)
        evses = cursor.fetchall()

    return {
        "evses": evses or [],
        "cursor": create_cursor(evses, sort, limit),
    }


def get_evse_by_id(connection, entry_id):
    return fetch_by_id(connection, Table.EvseView.value, entry_id)


def get_evse_by_ids(connection, station_id, evse_id):
    query = f"""
        SELECT * FROM {Table.EvseView.value}
        WHERE station_id = %s AND evse_id = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, (station_id, evse_id))
        evse = cursor.fetchone()
    return evse


def create_evse(connection, evse_data):
    query = f"""
        INSERT INTO {Table.Evse.value} (
          station_id, evse_id,
          connector_type, charge_level, price
        ) VALUES (%s, %s, %s, %s, %s)
    """
    values = (
        evse_data.get("station_id"),
        evse_data.get("evse_id"),
        evse_data.get("connector_type"),
        evse_data.get("charge_level"),
        evse_data.get("price"),
    )
    with connection.cursor() as cursor:
        cursor.execute(query, values)
        entry_id = cursor.lastrowid
    return entry_id


def update_evse(connection, station_id, evse_id, evse_data):
    query = f"UPDATE {Table.Evse.value} SET"

    field_set = set(get_fields(connection, Table.Evse.value))
    update_values = []
    for field, value in evse_data.items():
        if field in field_set:
            separator = "" if not update_values else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if not update_values:
        return False

    query += f" WHERE station_id = %s AND evse_id = %s"
    update_values.extend([station_id, evse_id])

    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, update_values)
    return affected_rows


def delete_evse(connection, station_id, evse_id):
    query = f"""
        DELETE FROM {Table.Evse.value}
        WHERE station_id = %s AND evse_id = %s
    """
    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, (station_id, evse_id))
    return affected_rows
