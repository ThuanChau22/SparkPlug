from src.repositories.utils import (
    Table,
    get_table_fields,
    fetch_all,
    fetch_one,
    insert_one,
    modify_one,
)
from src.utils import convert_coords_to_float


def get_sites(filter={}, select={}, sort={}, limit=None):
    query = f"SELECT * FROM {Table.Site.value}"

    field_set = set(get_table_fields(Table.Site.value))
    filter_values = []
    for field, value in filter.items():
        if field in field_set:
            separator = "WHERE" if len(filter_values) == 0 else "AND"
            query += f" {separator} {field} = %s"
            filter_values.append(value)

    if limit and limit > 0:
        query += f" LIMIT {limit}"

    sites = fetch_all(query, filter_values)
    return convert_coords_to_float(sites)


def get_site_by_id(site_id):
    query = f"SELECT * FROM {Table.Site.value} WHERE id = %s"
    site = fetch_one(query, site_id)
    return convert_coords_to_float([site])[0]


def create_site(site_data):
    query = f"""
      INSERT INTO {Table.Site.value} (
        owner_id, name, latitude, longitude,
        street_address, city, state, zip_code, country
      ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        site_data["owner_id"],
        site_data["name"],
        site_data["latitude"],
        site_data["longitude"],
        site_data["street_address"],
        site_data["city"],
        site_data["state"],
        site_data["zip_code"],
        site_data["country"],
    )
    return insert_one(query, values)


def update_site(site_id, site_data):
    query = f"UPDATE {Table.Site.value} SET"

    field_set = set(get_table_fields(Table.Site.value))
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

    affected_rows = modify_one(query, update_values)
    return affected_rows > 0


def delete_site(site_id):
    query = f"DELETE FROM {Table.Site.value} WHERE id = %s"
    affected_rows = modify_one(query, site_id)
    return affected_rows > 0
