from pydantic import BaseModel, Field
from typing import Optional
import sys

from src.config import (
    mysql_pool,
)
from src.utils import sanitize_input

class SQLQueryParams(BaseModel):
    owner_id: Optional[int] = Field(default=None, title="The ID of the owner.")
    country: Optional[str] = Field(default=None, title="The country of the station.")
    state: Optional[str] = Field(default=None, title="The state of the station.")
    city: Optional[str] = Field(default=None, title="The city of the station.")
    zip_code: Optional[int] = Field(default=None, title="The postal code of the station.")

def build_query(table, query_params: SQLQueryParams):
    params = query_params
    if not params:
        return f"SELECT * FROM {table}"

    query = f"SELECT * FROM {table} WHERE "
    for key, value in params.items():
        sanitized_value = sanitize_input(value)
        if isinstance(sanitized_value, str):
            param = f"'{sanitized_value}'" # Making sure to add quotes around strings so that the query is valid, e.g. WHERE country = 'USA' instead of WHERE country = USA
        else:
            param = sanitized_value
        query += f"{key} = {param} AND "
    query = query[:-4]  # Remove the last ' AND '
    return query

def fetch_data(query):
    sql_connection = mysql_pool.connection()
    with sql_connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
    return data

def query_stations_list_by_owner(owner_id: int = None):
    query = f"SELECT id FROM stations_joined"
    if owner_id:
        query = f"SELECT id FROM stations_joined WHERE owner_id = {owner_id}"
    result = fetch_data(query)
    ids_list = [item['id'] for item in result]
    return ids_list