from src.repositories.utils import (
    Table,
    get_fields,
    fetch_by_id,
)
from src.utils import convert_coords_to_float


def get_sites(connection, filter={}, select={}, sort={}, limit=None):
    query = f"SELECT * FROM {Table.Site.value}"

    field_set = set(get_fields(connection, Table.Site.value))
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
        sites = cursor.fetchall()

    return convert_coords_to_float(sites)


def get_site_by_id(connection, site_id):
    site = fetch_by_id(connection, Table.Site.value, site_id)
    return convert_coords_to_float([site])[0] if site else None


def create_site(connection, site_data):
    query = f"""
        INSERT INTO {Table.Site.value} (
          name, owner_id, latitude, longitude,
          street_address, city, state, zip_code, country
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        site_data["name"],
        site_data["owner_id"],
        site_data["latitude"],
        site_data["longitude"],
        site_data["street_address"],
        site_data["city"],
        site_data["state"],
        site_data["zip_code"],
        site_data["country"],
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
            separator = "" if len(update_values) == 0 else ","
            query += f"{separator} {field} = %s"
            update_values.append(value)

    if len(update_values) == 0:
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
