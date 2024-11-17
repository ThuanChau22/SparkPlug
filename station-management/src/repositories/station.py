from src.repositories.utils import (
    Table,
    get_fields,
    fetch_by_id,
)


def get_stations(connection, filter={}, select={}, sort={}, limit=None):
    query = f"SELECT * FROM {Table.StationView.value}"

    field_set = set(get_fields(connection, Table.StationView.value))
    filter_values = []
    for field, value in filter.items():
        if field in field_set:
            separator = "WHERE" if len(filter_values) == 0 else "AND"
            query += f" {separator} {field} = %s"
            filter_values.append(value)

    if limit and limit > 0:
        query += f" LIMIT {limit}"

    with connection.cursor() as cursor:
        cursor.execute(query, filter_values)
        stations = cursor.fetchall()

    return stations or []


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
            separator = "" if len(update_values) == 0 else ","
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
