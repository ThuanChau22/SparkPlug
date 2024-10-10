import requests
import uvicorn
from collections import defaultdict
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from src.config import (
    PORT,
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
)
from src.forecast_app import forecast
from src.mongo_app import fetch_transactions, fetch_evse_status, TransactionQueryParams
from src.sql_app import (
    build_query,
    fetch_data,
    query_stations_list_by_owner,
    SQLQueryParams,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WEB_DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
class TransactionQueryParams(BaseModel):
    start_date: str | None = Field(
        default=None, title="The start date of the query in the format MM/DD/YYYY."
    )
    end_date: str | None = Field(
        default=None, title="The end date of the query in the format MM/DD/YYYY."
    )
    station_id: str | None = Field(default=None, title="The ID of the station.")
    # station_list: list[int] | None = Field(default=None, title="A list of station IDs.")
    port_number: int | None = Field(default=None, title="The port number of the EVSE.")
    plug_type: str | None = Field(default=None, title="The type of the plug.")
    charge_level: str | None = Field(
        default=None, title="The charge level of the transaction."
    )
    user_id: int | None = Field(default=None, title="The ID of the user.")
    country: str | None = Field(default=None, title="The country of the station.")
    state: str | None = Field(default=None, title="The state of the station.")
    city: str | None = Field(default=None, title="The city of the station.")
    postal_code: int | None = Field(
        default=None, title="The postal code of the station."
    )
"""


# Handle permission
def get_user_with_permission(request: Request, allowed_roles: tuple):
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid Authorization header format"
        )

    res = requests.post(f"{AUTH_API_ENDPOINT}/verify", json={"token": token})
    data = res.json()
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=data)
    if data["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Permission denied")
    return {
        "user_id": data["id"],
        "role": data["role"],
    }


def require_permission(*allowed_roles):
    def dependency(request: Request):
        return get_user_with_permission(request, allowed_roles)

    return Depends(dependency)


def get_transactions(query_in: TransactionQueryParams, user: dict):
    if user.get("role") == "owner":
        # Get list of station IDs for the owner
        owner_id = user.get("user_id")
        owned_stations = query_stations_list_by_owner(owner_id)
        # Transform the list of integers into a comma-separated string
        owned_stations_str = ",".join(map(str, owned_stations))

        # Assign the string to "station_id"
        query_in["station_id"] = owned_stations_str

    transactions = fetch_transactions(query_in)
    return transactions


# Charting functions
def time_string_to_hours(time_str):
    try:
        hours, minutes, seconds = map(int, time_str.split(":"))
        return hours + minutes / 60 + seconds / 3600
    except ValueError:
        return 0  # Return 0 if the time format is incorrect


def generate_charts(raw_docs):
    revenue_by_date = defaultdict(float)
    sessions_by_date = defaultdict(int)
    utilization_by_date = defaultdict(float)
    energy_consumption_by_date = defaultdict(float)
    hour_counts = [0] * 24

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        date = datetime.utcfromtimestamp(timestamp_seconds)

        # Revenue
        f_date = date.strftime("%Y-%m-%d")
        revenue_by_date[f_date] += doc["fee"]
        sessions_by_date[f_date] += 1

        # Utilization Rate
        charging_time_hours = time_string_to_hours(doc["charging_time"])
        utilization_by_date[f_date] += charging_time_hours

        # Peak Time
        hour = date.hour
        hour_counts[hour] += 1

        # Energy Consumption
        energy_consumption_by_date[f_date] += doc["energy_consumed_kwh"]

    # Calculate utilization rate as a percentage
    for date in utilization_by_date:
        utilization_by_date[date] = (
            utilization_by_date[date] / 24
        ) * 100  # Convert to percentage

    sorted_dates = sorted(revenue_by_date.keys())
    rev_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Daily Revenue",
                "data": [revenue_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
            }
        ],
    }

    sessions_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Number of Sessions",
                "data": [sessions_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(255, 99, 132, 0.6)",
            }
        ],
    }

    peak_chart_data = {
        "labels": [f"{i}:00 - {i+1}:00" for i in range(24)],
        "datasets": [{"label": "Number of Transactions", "data": hour_counts}],
    }

    utilization_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Utilization Rate (%)",
                "data": [utilization_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(153, 102, 255, 0.6)",
            }
        ],
    }

    energy_consumption_chart_data = {
        "labels": sorted_dates,
        "datasets": [
            {
                "label": "Energy Consumption (kWh)",
                "data": [energy_consumption_by_date[date] for date in sorted_dates],
                "backgroundColor": "rgba(255, 206, 86, 0.6)",
            }
        ],
    }

    data_pack = {
        "revenue": rev_chart_data,
        "sessions_count": sessions_chart_data,
        "utilization_rate": utilization_chart_data,
        "peak_time": peak_chart_data,
        "energy_consumption": energy_consumption_chart_data,
    }

    return data_pack


def generate_chart_revenue_by_time_interval(raw_docs, interval="days"):
    revenue_by_interval = defaultdict(float)

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        datetime_obj = datetime.utcfromtimestamp(timestamp_seconds)

        # Determine the format based on the interval
        if interval == "days":
            formatted_date = datetime_obj.strftime("%Y-%m-%d")
        elif interval == "months":
            formatted_date = datetime_obj.strftime("%Y-%m")
        elif interval == "years":
            formatted_date = datetime_obj.strftime("%Y")
        else:
            raise ValueError(
                "Invalid interval. Choose from 'days', 'months', or 'years'."
            )

        # Revenue
        revenue_by_interval[formatted_date] += doc["fee"]

    sorted_intervals = sorted(revenue_by_interval.keys())
    rev_chart_data = {
        "labels": sorted_intervals,
        "datasets": [
            {
                "label": f"Revenue ({interval.capitalize()})",
                "data": [revenue_by_interval[date] for date in sorted_intervals],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
            }
        ],
    }

    return rev_chart_data


def generate_chart_session_count_by_time_interval(raw_docs, interval="days"):
    sessions_by_interval = defaultdict(int)

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        datetime_obj = datetime.utcfromtimestamp(timestamp_seconds)

        if interval == "days":
            formatted_date = datetime_obj.strftime("%Y-%m-%d")
        elif interval == "months":
            formatted_date = datetime_obj.strftime("%Y-%m")
        elif interval == "years":
            formatted_date = datetime_obj.strftime("%Y")
        else:
            raise ValueError(
                "Invalid interval. Choose from 'days', 'months', or 'years'."
            )

        sessions_by_interval[formatted_date] += 1

    sorted_intervals = sorted(sessions_by_interval.keys())
    sessions_chart_data = {
        "labels": sorted_intervals,
        "datasets": [
            {
                "label": f"Charging Sessions ({interval.capitalize()})",
                "data": [
                    sessions_by_interval[interval] for interval in sorted_intervals
                ],
                "backgroundColor": "rgba(255, 99, 132, 0.6)",
            }
        ],
    }

    return sessions_chart_data


def generate_chart_energy_consumption_by_time_interval(raw_docs, interval="days"):
    energy_consumption_by_interval = defaultdict(float)

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        datetime_obj = datetime.utcfromtimestamp(timestamp_seconds)

        if interval == "days":
            formatted_date = datetime_obj.strftime("%Y-%m-%d")
        elif interval == "months":
            formatted_date = datetime_obj.strftime("%Y-%m")
        elif interval == "years":
            formatted_date = datetime_obj.strftime("%Y")
        else:
            raise ValueError(
                "Invalid interval. Choose from 'days', 'months', or 'years'."
            )

        energy_consumption_by_interval[formatted_date] += doc["energy_consumed_kwh"]

    sorted_intervals = sorted(energy_consumption_by_interval.keys())
    energy_consumption_chart_data = {
        "labels": sorted_intervals,
        "datasets": [
            {
                "label": f"Energy Consumption (kWh) ({interval.capitalize()})",
                "data": [
                    energy_consumption_by_interval[interval]
                    for interval in sorted_intervals
                ],
                "backgroundColor": "rgba(255, 206, 86, 0.6)",
            }
        ],
    }

    return energy_consumption_chart_data


def generate_chart_utilization_rate_by_time_interval(raw_docs, interval="days"):
    utilization_by_interval = defaultdict(float)

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        datetime_obj = datetime.utcfromtimestamp(timestamp_seconds)

        if interval == "days":
            formatted_date = datetime_obj.strftime("%Y-%m-%d")
        elif interval == "months":
            formatted_date = datetime_obj.strftime("%Y-%m")
        elif interval == "years":
            formatted_date = datetime_obj.strftime("%Y")
        else:
            raise ValueError(
                "Invalid interval. Choose from 'days', 'months', or 'years'."
            )

        charging_time_hours = time_string_to_hours(doc["charging_time"])
        utilization_by_interval[formatted_date] += charging_time_hours

    for formatted_date in utilization_by_interval:
        utilization_by_interval[formatted_date] = (
            utilization_by_interval[formatted_date] / 24
        ) * 100  # Convert to percentage

    sorted_intervals = sorted(utilization_by_interval.keys())
    utilization_chart_data = {
        "labels": sorted_intervals,
        "datasets": [
            {
                "label": f"Utilization Rate (%) ({interval.capitalize()})",
                "data": [
                    utilization_by_interval[interval] for interval in sorted_intervals
                ],
                "backgroundColor": "rgba(153, 102, 255, 0.6)",
            }
        ],
    }

    return utilization_chart_data


def generate_chart_revenue_by_station(raw_docs, count=5, order="desc"):
    revenue_by_station = defaultdict(float)

    for doc in raw_docs:
        station_id = doc["station_id"]
        revenue_by_station[station_id] += doc["fee"]

    sorted_stations = sorted(
        revenue_by_station, key=revenue_by_station.get, reverse=(order == "desc")
    )
    sorted_stations = sorted_stations[:count]

    # Construct chart label
    top_or_bottom = "Top" if order == "desc" else "Bottom"

    rev_chart_data = {
        "labels": sorted_stations,
        "datasets": [
            {
                "label": f"{top_or_bottom} {count} Stations by Revenue",
                "data": [revenue_by_station[station] for station in sorted_stations],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
            }
        ],
    }

    return rev_chart_data


def generate_chart_session_count_by_station(raw_docs, count=5, order="desc"):
    sessions_by_station = defaultdict(int)

    for doc in raw_docs:
        station_id = doc["station_id"]
        sessions_by_station[station_id] += 1

    sorted_stations = sorted(
        sessions_by_station, key=sessions_by_station.get, reverse=(order == "desc")
    )
    sorted_stations = sorted_stations[:count]

    # Construct chart label
    top_or_bottom = "Top" if order == "desc" else "Bottom"

    sessions_chart_data = {
        "labels": sorted_stations,
        "datasets": [
            {
                "label": f"{top_or_bottom} {count} Most Visited Stations",
                "data": [sessions_by_station[station] for station in sorted_stations],
                "backgroundColor": "rgba(255, 99, 132, 0.6)",
            }
        ],
    }

    return sessions_chart_data


def generate_chart_energy_consumption_by_station(raw_docs, count=5, order="desc"):
    energy_consumption_by_station = defaultdict(float)

    for doc in raw_docs:
        station_id = doc["station_id"]
        energy_consumption_by_station[station_id] += doc["energy_consumed_kwh"]

    sorted_stations = sorted(
        energy_consumption_by_station,
        key=energy_consumption_by_station.get,
        reverse=(order == "desc"),
    )
    sorted_stations = sorted_stations[:count]

    # Construct chart label
    top_or_bottom = "Top" if order == "desc" else "Bottom"

    energy_consumption_chart_data = {
        "labels": sorted_stations,
        "datasets": [
            {
                "label": f"{top_or_bottom} {count} Stations by Energy Consumption (kWh)",
                "data": [
                    energy_consumption_by_station[station]
                    for station in sorted_stations
                ],
                "backgroundColor": "rgba(255, 206, 86, 0.6)",
            }
        ],
    }

    return energy_consumption_chart_data


def generate_chart_utilization_rate_by_station(raw_docs, count=5, order="desc"):
    utilization_by_station = defaultdict(float)

    for doc in raw_docs:
        station_id = doc["station_id"]
        charging_time_hours = time_string_to_hours(doc["charging_time"])
        utilization_by_station[station_id] += charging_time_hours

    for station_id in utilization_by_station:
        utilization_by_station[station_id] = (
            utilization_by_station[station_id] / 24
        ) * 100  # Convert to percentage

    sorted_stations = sorted(
        utilization_by_station,
        key=utilization_by_station.get,
        reverse=(order == "desc"),
    )
    sorted_stations = sorted_stations[:count]

    # Construct chart label
    top_or_bottom = "Top" if order == "desc" else "Bottom"

    utilization_chart_data = {
        "labels": sorted_stations,
        "datasets": [
            {
                "label": f"{top_or_bottom} {count} Stations by Utilization Rate (%)",
                "data": [
                    utilization_by_station[station] for station in sorted_stations
                ],
                "backgroundColor": "rgba(153, 102, 255, 0.6)",
            }
        ],
    }

    return utilization_chart_data


def generate_chart_peak_time(raw_docs):
    hour_counts = [0] * 24

    for doc in raw_docs:
        mongo_timestamp = doc["transaction_date"]
        timestamp_seconds = mongo_timestamp / 1000.0
        date = datetime.utcfromtimestamp(timestamp_seconds)

        # Peak Time
        hour = date.hour
        hour_counts[hour] += 1

    peak_chart_data = {
        "labels": [f"{i}:00 - {i+1}:00" for i in range(24)],
        "datasets": [{"label": "Hourly Transaction Count", "data": hour_counts}],
    }

    return peak_chart_data


def generate_chart_entity_growth(
    entity, raw_docs, interval="months", start_date="01/01/2010", end_date="12/31/2022"
):
    station_growth_by_interval = defaultdict(int)

    # Convert start_date and end_date to datetime objects
    if start_date:
        start_date_obj = datetime.strptime(start_date, "%m/%d/%Y")
    if end_date:
        end_date_obj = datetime.strptime(end_date, "%m/%d/%Y")

    for doc in raw_docs:
        # created_at_str = doc["created_at"]
        # datetime_obj = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")

        datetime_obj = doc["created_at"]

        # Filter by date range
        if start_date and datetime_obj < start_date_obj:
            continue
        if end_date and datetime_obj > end_date_obj:
            continue

        if interval == "days":
            formatted_date = datetime_obj.strftime("%Y-%m-%d")
        elif interval == "months":
            formatted_date = datetime_obj.strftime("%Y-%m")
        elif interval == "years":
            formatted_date = datetime_obj.strftime("%Y")
        else:
            raise ValueError(
                "Invalid interval. Choose from 'days', 'months', or 'years'."
            )

        station_growth_by_interval[formatted_date] += 1

    sorted_intervals = sorted(station_growth_by_interval.keys())
    growth_chart_data = {
        "labels": sorted_intervals,
        "datasets": [
            {
                "label": f"New {entity} ({interval.capitalize()})",
                "data": [station_growth_by_interval[date] for date in sorted_intervals],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
            }
        ],
    }

    return growth_chart_data


"""@app.get("/example")
async def example_route(user: dict = require_permission("staff", "owner")):
    return {"message": "Hello, you have access", "user": user}"""


###########################################################################
# API Routes
###########################################################################

# Test Routes
"""@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, owner_id: Optional[int] = None, station_id: Optional[int] = None):
    return {"item_id": item_id, "q": owner_id, "station_id": station_id}

@app.get("/api/stations/analytics")
def check_route():
    message = "SparkPlug Analytics API!"
    return {"message": message}

@app.get("/permission-test")
async def permission_test(user: dict = require_permission("staff", "owner")):
    return {"message": "Hello, you have access", "user": user}

@app.get("/test-db")
def test_db():
    table = "Station"
    test_query = f"SELECT * FROM {table}"
    try:
        result = fetch_data(test_query)
        return {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.get("/test-build-query")
def test_build_query():
    params = SQLQueryParams(owner_id=1)
    query = build_query("Station", params)
    return query

@app.get("/test-station-list")
def test_station_list(user: dict = require_permission("staff", "owner", "driver")):
    owner_id = None
    if user.get("role") == "owner":
        owner_id = user.get("user_id")
    try:
        result = query_stations_list_by_owner(owner_id)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/test-mongo")
async def test_mongo_db():
    return test_mongo()
"""


@app.get("/api/stations")
async def get_stations(
    owner_id: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    owner_id_input = owner_id
    if user.get("role") == "owner":
        owner_id_input = user.get("user_id")
    params = SQLQueryParams(owner_id=owner_id_input)
    query = build_query("stations_joined", params)
    try:
        result = fetch_data(query)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/stations/analytics/transactions")
async def retrieve_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    station_id: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    return get_transactions(query_in, user)


@app.get("/api/stations/analytics/transactions/{station_id}")
async def retrieve_transactions_by_station(
    station_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    # query_in["station_list"] = [station_id]
    return get_transactions(query_in, user)


@app.get("/api/stations/analytics/charts")
async def generate_charts_from_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    station_id: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    # Generate charts from transactions
    if user.get("role") == "driver":
        return generate_chart_peak_time(transactions)
    return generate_charts(transactions)


@app.get("/api/stations/analytics/charts/all/{station_id}")
async def generate_charts_by_station(
    station_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    # query_in["station_list"] = [station_id]
    transactions = get_transactions(query_in, user)
    # Generate charts from transactions
    if user.get("role") == "driver":
        return generate_chart_peak_time(transactions)
    return generate_charts(transactions)


@app.get("/api/stations/analytics/evse-status")
async def retrieve_evse_status(
    evse_id: Optional[int] = None,
    station_id: Optional[str] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = {"evse_id": evse_id, "station_id": station_id}
    query_in = query_in.dict(exclude_none=True)
    return fetch_evse_status(query_in)


@app.get("/api/stations/analytics/energy-forecast")
async def forecast_energy_consumption(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    station_id: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)

    transactions = get_transactions(query_in, user)
    # return transactions
    return forecast(transactions)


@app.get("/api/stations/analytics/energy-forecast/{station_id}")
async def forecast_energy_consumption_by_station(
    station_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    port_number: Optional[int] = None,
    plug_type: Optional[str] = None,
    charge_level: Optional[str] = None,
    user_id: Optional[int] = None,
    country: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    postal: Optional[int] = None,
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        station_id=station_id,
        port_number=port_number,
        plug_type=plug_type,
        charge_level=charge_level,
        user_id=user_id,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)

    transactions = get_transactions(query_in, user)
    # return transactions
    return forecast(transactions)


# Charts
# Universal filter params: start_date, end_date, country, state, city, postal_code

## Metric over time interval
## Intervals: days, months, years


### Revenue
@app.get("/api/stations/analytics/charts/revenue-by-time-interval")
async def chart_revenue_by_time_interval(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    interval: str = Query(
        "days",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_revenue_by_time_interval(transactions, interval)


### Session Count
@app.get("/api/stations/analytics/charts/session-count-by-time-interval")
async def chart_session_count_by_time_interval(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    interval: str = Query(
        "days",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_session_count_by_time_interval(transactions, interval)


### Energy Consumption
@app.get("/api/stations/analytics/charts/energy-consumption-by-time-interval")
async def chart_energy_consumption_by_time_interval(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    interval: str = Query(
        "days",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_energy_consumption_by_time_interval(transactions, interval)


### Utilization Rate - Calculation not quite right, need to revisit later
"""
@app.get("/api/stations/analytics/charts/utilization-rate-by-time-interval")
async def chart_utilization_rate_by_time_interval(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("staff", "owner"),
    interval: str = Query("days", description="Time interval represented by each unit of the X-axis", examples=["days", "months", "years"]),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_utilization_rate_by_time_interval(transactions, interval)
"""

## Metric by station
## Options: displayed_stations_count (int), order (asc, desc)


### Revenue
@app.get("/api/stations/analytics/charts/revenue-by-station")
async def chart_revenue_by_station(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    count: int = Query(
        5, description="Number of stations to display", examples=[5, 10, 20]
    ),
    order: str = Query(
        "desc", description="Order of stations", examples=["asc", "desc"]
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_revenue_by_station(transactions, count, order)


### Session Count
@app.get("/api/stations/analytics/charts/session-count-by-station")
async def chart_session_count_by_station(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    count: int = Query(
        5, description="Number of stations to display", examples=[5, 10, 20]
    ),
    order: str = Query(
        "desc", description="Order of stations", examples=["asc", "desc"]
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_session_count_by_station(transactions, count, order)


### Energy Consumption
@app.get("/api/stations/analytics/charts/energy-consumption-by-station")
async def chart_energy_consumption_by_station(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner"),
    count: int = Query(
        5, description="Number of stations to display", examples=[5, 10, 20]
    ),
    order: str = Query(
        "desc", description="Order of stations", examples=["asc", "desc"]
    ),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_energy_consumption_by_station(transactions, count, order)


### Utilization Rate - Calculation not quite right, need to revisit later
"""
@app.get("/api/stations/analytics/charts/utilization-rate-by-station")
async def chart_utilization_rate_by_station(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("staff", "owner"),
    count: int = Query(5, description="Number of stations to display", examples=[5, 10, 20]),
    order: str = Query("desc", description="Order of stations", examples=["asc", "desc"]),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_utilization_rate_by_station(transactions, count, order)
"""


### Peak Time Chart
@app.get("/api/stations/analytics/charts/peak-time")
async def chart_peak_time(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_peak_time(transactions)


## Meta Charts
## Intervals: days, months, years


### Station Growth
@app.get("/api/stations/analytics/charts/station-growth")
def chart_station_growth(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    country: Optional[str] = Query(
        None, description="Title case", examples=["USA", "Burkina+Faso"]
    ),
    state: Optional[str] = Query(
        None,
        description="Full state name, title case",
        examples=["California", "New+York"],
    ),
    city: Optional[str] = Query(
        None, description="Title case", examples=["Palo+Alto", "Fremont"]
    ),
    postal: Optional[int] = Query(
        None,
        description="Currently only supports US zip codes, as int",
        examples=[94040, 6001],
    ),
    interval: str = Query(
        "months",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
    user: dict = require_permission("staff", "owner"),
    owner_id: Optional[int] = None,
):

    # Default to the owner's ID if the user is owner
    owner_id_input = owner_id
    if user.get("role") == "owner":
        owner_id_input = user.get("user_id")

    country_input = country
    state_input = state
    city_input = city
    postal_input = postal

    params = SQLQueryParams(
        owner_id=owner_id_input,
        country=country_input,
        state=state_input,
        city=city_input,
        zip_code=postal_input,
    )

    params = params.dict(exclude_none=True)

    query = build_query("stations_joined", params)
    try:
        stations = fetch_data(query)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    return generate_chart_entity_growth(
        "Stations", stations, interval, start_date, end_date
    )


### Owner Growth
@app.get("/api/stations/analytics/charts/owner-growth")
def chart_owner_growth(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    interval: str = Query(
        "months",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
    user: dict = require_permission("staff"),
):

    query = "SELECT * FROM users_joined WHERE owner = 1"

    try:
        owners = fetch_data(query)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    return generate_chart_entity_growth(
        "Station Owners", owners, interval, start_date, end_date
    )


### Driver Growth
@app.get("/api/stations/analytics/charts/driver-growth")
def chart_driver_growth(
    start_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["01/01/2020"]
    ),
    end_date: Optional[str] = Query(
        None, description="Format MM/DD/YYYY", examples=["12/31/2020"]
    ),
    interval: str = Query(
        "months",
        description="Time interval represented by each unit of the X-axis",
        examples=["days", "months", "years"],
    ),
    user: dict = require_permission("staff"),
):

    query = "SELECT * FROM users_joined WHERE driver = 1"

    try:
        drivers = fetch_data(query)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    return generate_chart_entity_growth(
        "Drivers", drivers, interval, start_date, end_date
    )


###########################################################################
# Driver Dashboard Charts - split into new service later?
###########################################################################

## Metric over time interval
## Intervals: days, months, years

### Revenue
@app.get("/api/stations/analytics/charts/driver-revenue-by-time-interval")
async def driver_chart_revenue_by_time_interval(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    interval: str = Query("days", description="Time interval represented by each unit of the X-axis", examples=["days", "months", "years"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_revenue_by_time_interval(transactions, interval)

### Session Count
@app.get("/api/stations/analytics/charts/driver-session-count-by-time-interval")
async def driver_chart_session_count_by_time_interval(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    interval: str = Query("days", description="Time interval represented by each unit of the X-axis", examples=["days", "months", "years"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_session_count_by_time_interval(transactions, interval)

### Energy Consumption
@app.get("/api/stations/analytics/charts/driver-energy-consumption-by-time-interval")
async def driver_chart_energy_consumption_by_time_interval(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    interval: str = Query("days", description="Time interval represented by each unit of the X-axis", examples=["days", "months", "years"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_energy_consumption_by_time_interval(transactions, interval)

## Metric by station
## Options: displayed_stations_count (int), order (asc, desc)

### Revenue
@app.get("/api/stations/analytics/charts/driver-revenue-by-station")
async def driver_chart_revenue_by_station(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    count: int = Query(5, description="Number of stations to display", examples=[5, 10, 20]),
    order: str = Query("desc", description="Order of stations", examples=["asc", "desc"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_revenue_by_station(transactions, count, order)

### Session Count
@app.get("/api/stations/analytics/charts/driver-session-count-by-station")
async def driver_chart_session_count_by_station(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    count: int = Query(5, description="Number of stations to display", examples=[5, 10, 20]),
    order: str = Query("desc", description="Order of stations", examples=["asc", "desc"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_session_count_by_station(transactions, count, order)

### Energy Consumption
@app.get("/api/stations/analytics/charts/driver-energy-consumption-by-station")
async def driver_chart_energy_consumption_by_station(
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("driver"),
    count: int = Query(5, description="Number of stations to display", examples=[5, 10, 20]),
    order: str = Query("desc", description="Order of stations", examples=["asc", "desc"]),
):
    query_in = TransactionQueryParams(
        user_id=user.get("user_id"),
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_energy_consumption_by_station(transactions, count, order)

@app.get("/api/stations/analytics/charts/peak-time/{station_id}")
async def driver_chart_peak_time(
    station_id: str,
    start_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["01/01/2020"]),
    end_date: Optional[str] = Query(None, description="Format MM/DD/YYYY", examples=["12/31/2020"]),
    country: Optional[str] = Query(None, description="Title case", examples=["USA", "Burkina+Faso"]),
    state: Optional[str] = Query(None, description="Full state name, title case", examples=["California", "New+York"]),
    city: Optional[str] = Query(None, description="Title case", examples=["Palo+Alto", "Fremont"]),
    postal: Optional[int] = Query(None, description="Currently only supports US zip codes, as int", examples=[94040, 6001]),
    user: dict = require_permission("staff", "owner", "driver"),
):
    query_in = TransactionQueryParams(
        station_id=station_id,
        start_date=start_date,
        end_date=end_date,
        country=country,
        state=state,
        city=city,
        postal_code=postal,
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    return generate_chart_peak_time(transactions)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(PORT), reload=True)
