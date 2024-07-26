from src.repositories.utils import (
    Table,
    get_table_fields,
    fetch_all,
    fetch_one,
    insert_one,
    modify_one,
)
from src.utils import convert_coords_to_float


def get_stations(filter={}, select={}, sort={}, limit=None):
    query = f"SELECT * FROM {Table.StationView.value}"

    field_set = set(get_table_fields(Table.StationView.value))
    filter_values = []
    for field, value in filter.items():
        if field in field_set:
            separator = "WHERE" if len(filter_values) == 0 else "AND"
            query += f" {separator} {field} = %s"
            filter_values.append(value)

    if limit and limit > 0:
        query += f" LIMIT {limit}"

    stations = fetch_all(query, filter_values)
    return convert_coords_to_float(stations)


def get_station_by_id(station_id):
    query = f"SELECT * FROM {Table.StationView.value} WHERE id = %s"
    station = fetch_one(query, station_id)
    return convert_coords_to_float([station])[0]


def create_station(station_data):
    query = f"""
      INSERT INTO {Table.Station.value} (
        name, site_id, latitude, longitude
      ) VALUES (%s, %s, %s, %s)
    """
    values = (
        station_data["name"],
        station_data["site_id"],
        station_data["latitude"],
        station_data["longitude"],
    )
    return insert_one(query, values)


def update_station(station_id, station_data):
    query = f"UPDATE {Table.Station.value} SET"

    field_set = set(get_table_fields(Table.Station.value))
    update_values = []
    for field, value in station_data.items():
        if field in field_set:
            separator = "" if len(update_values) == 0 else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if len(update_values) == 0:
        return False

    query += f" WHERE id = %s"
    update_values.append(station_id)

    affected_rows = modify_one(query, update_values)
    return affected_rows > 0


def delete_station(station_id):
    query = f"DELETE FROM {Table.Station.value} WHERE id = %s"
    affected_rows = modify_one(query, station_id)
    return affected_rows > 0
