from enum import Enum

# Internal Modules
from src.config import mysql


class Table(Enum):
    Site = "Site"
    Station = "Station"
    Evse = "EVSE"
    StationView = "stations_joined"
    EvseView = "evses_joined"


def fetch_all(query, values=None):
    connection = mysql.connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            return cursor.fetchall()
    finally:
        connection.close()


def fetch_one(query, values=None):
    connection = mysql.connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            return cursor.fetchone()
    finally:
        connection.close()


def insert_one(query, values=None):
    connection = mysql.connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            return cursor.lastrowid
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        connection.commit()
        connection.close()


def modify_one(query, values=None):
    connection = mysql.connection()
    try:
        with connection.cursor() as cursor:
            return cursor.execute(query, values)
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        connection.commit()
        connection.close()


def get_table_fields(table):
    query = f"SHOW COLUMNS FROM {table}"
    data = fetch_all(query)
    return [item["Field"] for item in data]
