from .utils import sanitize_input
from pydantic import BaseModel, Field
from typing import Optional

from .config import (
    mysql_pool,
)

class SQLQueryParams(BaseModel):
    owner_id: Optional[int] = Field(default=None, title="The ID of the owner.")

def build_query(table, query_params: SQLQueryParams):
    params = query_params.dict(exclude_none=True)
    if not params:
        return f"SELECT * FROM {table}"

    query = f"SELECT * FROM {table} WHERE "
    for key, value in params.items():
        param = f"{sanitize_input(value)}"
        if key == 'owner_id':
            param = value
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