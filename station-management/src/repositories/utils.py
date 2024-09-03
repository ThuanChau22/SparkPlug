from enum import Enum

# Internal Modules
from src.config import mysql


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
