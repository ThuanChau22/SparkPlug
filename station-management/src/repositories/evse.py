from src.repositories.utils import (
    Table,
    get_fields,
    fetch_by_id,
)
from src.utils import (
    convert_coords_to_float,
    convert_price_to_float,
)


def get_evses(connection, filter={}, select={}, sort={}, limit=None):
    query = f"SELECT * FROM {Table.EvseView.value}"

    field_set = set(get_fields(connection, Table.EvseView.value))
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
        evses = cursor.fetchall()

    evses = convert_coords_to_float(evses)
    evses = convert_price_to_float(evses)
    return evses


def get_evse_by_id(connection, entry_id):
    evse = fetch_by_id(connection, Table.EvseView.value, entry_id)
    if evse:
        evses = convert_coords_to_float([evse])
        return convert_price_to_float(evses)[0]
    return None


def get_evse_by_ids(connection, station_id, evse_id):
    query = f"""
        SELECT * FROM {Table.EvseView.value}
        WHERE station_id = %s AND evse_id = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, (station_id, evse_id))
        evse = cursor.fetchone()
    if evse:
        evses = convert_coords_to_float([evse])
        return convert_price_to_float(evses)[0]
    return None


def create_evse(connection, evse_data):
    query = f"""
        INSERT INTO {Table.Evse.value} (
          station_id, evse_id,
          connector_type, charge_level, price
        ) VALUES (%s, %s, %s, %s, %s)
    """
    values = (
        evse_data["station_id"],
        evse_data["evse_id"],
        evse_data["connector_type"],
        evse_data["charge_level"],
        evse_data["price"],
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
            separator = "" if len(update_values) == 0 else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if len(update_values) == 0:
        return False

    query += f" WHERE station_id = %s AND evse_id = %s"
    update_values.append(station_id)
    update_values.append(evse_id)

    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, update_values)
    return affected_rows > 0 if affected_rows else False


def delete_evse(connection, station_id, evse_id):
    query = f"""
        DELETE FROM {Table.Evse.value}
        WHERE station_id = %s AND evse_id = %s
    """
    with connection.cursor() as cursor:
        affected_rows = cursor.execute(query, (station_id, evse_id))
    return affected_rows > 0 if affected_rows else False
