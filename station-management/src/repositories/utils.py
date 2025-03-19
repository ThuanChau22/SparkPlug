from enum import Enum
from datetime import datetime
import re

# Internal Modules
from src.config import mysql
from src.utils import (
    urlsafe_b64_json_encode,
    urlsafe_b64_json_decode,
)


class Table(Enum):
    Site = "Site"
    Station = "Station"
    Evse = "EVSE"
    StationView = "stations_joined"
    EvseView = "evses_joined"


def transaction(callback, modify=False):
    connection = mysql.connection()
    try:
        return callback(connection)
    except Exception as e:
        if modify:
            connection.rollback()
        raise e
    finally:
        if modify:
            connection.commit()
        connection.close()


def get_fields(connection, table):
    query = f"SHOW COLUMNS FROM {table}"
    with connection.cursor() as cursor:
        cursor.execute(query)
        data = cursor.fetchall()
        return [item["Field"] for item in data]


def fetch_by_id(connection, table, id):
    query = f"SELECT * FROM {table} WHERE id = %s"
    with connection.cursor() as cursor:
        cursor.execute(query, id)
        return cursor.fetchone()


def append_condition(statement, condition):
    hasCondition = re.search("^.*( WHERE ){1}.*$", statement, re.IGNORECASE)
    separator = "" if not condition else " AND " if hasCondition else " WHERE "
    return f"{statement}{separator}{condition}"


def select_fields(params={}, table_fields=[]):
    statement = "*"
    if params:
        require = ["id", "created_at"]
        include = set(require)
        exclude = set(table_fields)
        for field, value in params.items():
            if field in exclude and value == 1:
                include.add(field)
            elif field in exclude and value == 0:
                exclude.remove(field)
        if len(include) > len(require):
            exclude = {field for field in require if field not in exclude}
            include.difference_update(exclude)
            include = [field for field in table_fields if field in include]
            statement = ", ".join(include)
        elif len(exclude) < len(table_fields):
            exclude = [field for field in table_fields if field in exclude]
            statement = ", ".join(exclude)
    return f"SELECT {statement}"


def select_search(statement, values, search_fields, search_term, table_fields=[]):
    if search_fields and search_term:
        statement += f", MATCH ({','.join(search_fields)}) AGAINST(%s) as search_score"
        values.append(search_term)
        table_fields.append("search_score")
    return statement


def select_distance(statement, values, lat_lng_origin, table_fields=[]):
    if lat_lng_origin and len(lat_lng_origin.split(",")) == 2:
        statement += ", haversine(%s, %s, latitude, longitude) as distance"
        values.extend(lat_lng_origin.split(","))
        table_fields.append("distance")
    return statement


def where_fields_equal(statement, values, params={}, table_fields=[]):
    if params:
        field_set = set(table_fields)
        for field, value in params.items():
            if field in field_set and value:
                statement = append_condition(statement, f"{field} = %s")
                values.append(value)
    return statement


def where_search_match(statement, values, search_fields, search_term):
    if search_fields and search_term:
        condition = f"MATCH ({','.join(search_fields)}) AGAINST(%s)"
        statement = append_condition(statement, condition)
        values.append(search_term)
    return statement


def where_lat_lng_range(statement, values, lat_lng_min, lat_lng_max):
    if lat_lng_min and len(lat_lng_min.split(",")) == 2:
        condition = "(latitude >= %s AND longitude >= %s)"
        statement = append_condition(statement, condition)
        values.extend(lat_lng_min.split(","))
    if lat_lng_max and len(lat_lng_max.split(",")) == 2:
        condition = "(latitude <= %s AND longitude <= %s)"
        statement = append_condition(statement, condition)
        values.extend(lat_lng_max.split(","))
    return statement


def having_cursor_at(statement, values, sort, cursor):
    if sort and cursor:
        payload = urlsafe_b64_json_decode(cursor)
        params = [(field, payload.get(field)) for field in sort.keys()]
        params = [(field, value) for field, value in params if value]
        condition = ""
        condition_values = []
        for field, value in params[::-1]:
            operator = "<" if sort.get(field) == -1 else ">"
            if not condition:
                condition = f"{field} {operator} %s"
                condition_values.append(value)
            else:
                condition = f"({field} {operator} %s OR ({field} = %s AND {condition}))"
                condition_values = [value, value] + condition_values
        statement = f"{statement} HAVING {condition}"
        values.extend(condition_values)
    return statement


def sort_by_fields(statement, params={}, table_fields=[]):
    if params:
        sort_values = []
        field_set = set(table_fields)
        for field, value in params.items():
            if field in field_set:
                sort_values.append(f"{field} DESC" if value == -1 else field)
        if sort_values:
            conditions = ", ".join(sort_values)
            return f"{statement} ORDER BY {conditions}"
    return statement


def limit_at(statement, limit):
    return f"{statement} LIMIT {limit}" if limit and limit > 0 else statement


def create_cursor(resources, sort, limit):
    payload = {}
    if sort and len(resources) == limit:
        last_resource = resources[len(resources) - 1]
        params = [(field, last_resource.get(field)) for field in sort.keys()]
        params = [(field, value) for field, value in params if value]
        for field, value in params:
            is_datetime = isinstance(value, datetime)
            payload[field] = value.isoformat() if is_datetime else value
    return {"next": (urlsafe_b64_json_encode(payload) if payload else "")}
