from datetime import datetime, timedelta
import sys
from .utils import sanitize_input
from pydantic import BaseModel, Field
from typing import Optional

from .config import (
    mongo_connection as db,
)

class TransactionQueryParams(BaseModel):
    start_date: str | None = Field(default=None, title="The start date of the query in the format MM/DD/YYYY.")
    end_date: str | None = Field(default=None, title="The end date of the query in the format MM/DD/YYYY.")
    station_id: int | None = Field(default=None, title="The ID of the station.")
    station_list: list[int] | None = Field(default=None, title="A list of station IDs.")
    port_number: int | None = Field(default=None, title="The port number of the EVSE.")
    plug_type: str | None = Field(default=None, title="The type of the plug.")
    charge_level: int | None = Field(default=None, title="The charge level of the transaction.")
    user_id: int | None = Field(default=None, title="The ID of the user.")
    country: str | None = Field(default=None, title="The country of the station.")
    state: str | None = Field(default=None, title="The state of the station.")
    city: str | None = Field(default=None, title="The city of the station.")
    postal_code: int | None = Field(default=None, title="The postal code of the station.")

# DB test
def test_mongo():
    try:
        query_out = {}
        transactions = db.charging_sessions.find(query_out)
        transactions_list = list(transactions)
        
        # Convert ObjectId to string
        for transaction in transactions_list:
            transaction["_id"] = str(transaction["_id"])
        
        return {"status": "success", "data": transactions_list}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Date operations
def date_to_milliseconds(date_str, date_format="%m/%d/%Y"):
    try:
        dt = datetime.strptime(date_str, date_format)
        epoch = datetime.utcfromtimestamp(0)  # Unix epoch start time
        return int((dt - epoch).total_seconds() * 1000)
    except ValueError:
        # Handle the exception if the date_str format is incorrect
        return None

def iso_to_milliseconds(iso_date):
    """
    Converts an ISO formatted date string to the number of milliseconds since the Unix epoch.
    :param iso_date: The ISO formatted date string.
    :return: The number of milliseconds since the Unix epoch.
    """
    # Convert the ISO formatted date string to a datetime object
    dt = datetime.fromisoformat(iso_date)

    # Convert the datetime object to the number of milliseconds since the Unix epoch
    epoch = datetime.utcfromtimestamp(0)
    milliseconds = (dt - epoch).total_seconds() * 1000.0

    return int(milliseconds)

def time_string_to_hours(time_str):
    try:
        hours, minutes, seconds = map(int, time_str.split(":"))
        return hours + minutes / 60 + seconds / 3600
    except ValueError:
        return 0  # Return 0 if the time format is incorrect

def get_current_and_past_date():
    current_date = datetime.now()
    past_date = current_date - timedelta(days=30)
    
    # Format the dates as "MM/DD/YYYY"
    current_date_str = current_date.strftime("%m/%d/%Y")
    past_date_str = past_date.strftime("%m/%d/%Y")
    
    return (current_date_str, past_date_str)

# Database actions
def fetch_transactions(query_in):
    """
    Fetches transactions from the database based on a query.
    :param query: The query parameters.
    :return: A list of transactions.
    """
    query_out = {}

    if "station_list" in query_in:
        # Convert the station_id parameter to a list of integers
        #station_ids = [int(id) for id in query_in["station_list"].split(",")]
        station_ids = query_in["station_list"]
        query_out["station_id"] = {"$in": station_ids}
    
    if "charge_level" in query_in:
        charge_level_map = {"1": "Level 1", "2": "Level 2"}
        charge_levels = [
            charge_level_map[level]
            for level in query_in["charge_level"].split()
            if level in charge_level_map
        ]
        if charge_levels:
            query_out["charge_level"] = {"$in": charge_levels}

    # Flter transactions by date range
    if "start_date" not in query_in:
        # query_in["start_date"] = get_current_and_past_date()[1]
        query_in["start_date"] = "01/01/2020"
    if "end_date" not in query_in:
        # query_in["end_date"] = get_current_and_past_date()[0]
        query_in["end_date"] = "12/31/2020"
    
    start_ms = date_to_milliseconds(query_in["start_date"])
    end_ms = date_to_milliseconds(query_in["end_date"])
    query_out["transaction_date"] = {"$gte": start_ms, "$lte": end_ms}

    # Other filters
    if "postal_code" in query_in:
        query_out["postal_code"] = int(query_in["postal_code"])
    if "city" in query_in:
        query_out["city"] = query_in["city"]
    if "state" in query_in:
        query_out["state"] = query_in["state"]
    if "country" in query_in:
        query_out["country"] = query_in["country"]
    if "plug_type" in query_in:
        query_out["plug_type"] = query_in["plug_type"]
    if "port_number" in query_in:
        query_out["port_number"] = int(query_in["port_number"])
    if "user_id" in query_in:
        query_out["user_id"] = int(query_in["user_id"])
    print(f"New Query: {query_out}", file=sys.stderr)

    transactions = db.charging_sessions.find(query_out)
    transactions_list = list(transactions)
    for transaction in transactions_list:
        transaction["_id"] = str(transaction["_id"])
    return transactions_list

def fetch_evse_status(query_in):
    """
    Fetches EVSE status updates from the database based on a query.
    :param query: The query parameters.
    :return: A list of EVSE status updates.
    """
    query_out = {}

    if "evse_id" in query_in:
        # Convert the evse_id parameter to a list of integers
        evse_ids = [int(id) for id in query_in["evse_id"].split(",")]
        query_out["evse_id"] = {"$in": evse_ids}
    
    if "station_id" in query_in:
        # Convert the station_id parameter to a list of integers
        station_ids = [int(id) for id in query_in["station_id"].split(",")]
        query_out["station_id"] = {"$in": station_ids}

    print(f"New Query: {query_out}", file=sys.stderr)

    evse_status_updates = db.evse_status.find(query_out)
    evse_status_list = list(evse_status_updates)
    for evse_status in evse_status_list:
        evse_status["_id"] = str(evse_status["_id"])
    return evse_status_list