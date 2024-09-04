import requests
from fastapi import FastAPI, Request, HTTPException, Depends
from typing import Union, Optional
from datetime import datetime

from pydantic import BaseModel, Field
from collections import defaultdict

from fastapi.middleware.cors import CORSMiddleware

from src.sql_app import build_query, fetch_data, query_stations_list_by_owner
from src.mongo_app import fetch_transactions, fetch_evse_status, test_mongo
from src.forecast_app import json_to_df, forecast
from src.config import (
    WEB_DOMAIN,
    AUTH_API_ENDPOINT,
    ENERGY_FORECAST_MODEL_PATH,
    mongo_connection as db,
)

app = FastAPI()

origins = [
    WEB_DOMAIN,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Query Param Models
class SQLQueryParams(BaseModel):
    owner_id: Optional[int] = Field(default=None, title="The ID of the owner.")

class TransactionQueryParams(BaseModel):
    start_date: str | None = Field(default=None, title="The start date of the query in the format MM/DD/YYYY.")
    end_date: str | None = Field(default=None, title="The end date of the query in the format MM/DD/YYYY.")
    station_id: str | None = Field(default=None, title="The ID of the station.")
    #station_list: list[int] | None = Field(default=None, title="A list of station IDs.")
    port_number: int | None = Field(default=None, title="The port number of the EVSE.")
    plug_type: str | None = Field(default=None, title="The type of the plug.")
    charge_level: str | None = Field(default=None, title="The charge level of the transaction.")
    user_id: int | None = Field(default=None, title="The ID of the user.")
    country: str | None = Field(default=None, title="The country of the station.")
    state: str | None = Field(default=None, title="The state of the station.")
    city: str | None = Field(default=None, title="The city of the station.")
    postal_code: int | None = Field(default=None, title="The postal code of the station.")
    

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
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    
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
        owned_stations_str = ','.join(map(str, owned_stations))
        
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

def generate_peak(raw_docs):
    revenue_by_date = defaultdict(float)
    sessions_by_date = defaultdict(int)
    utilization_by_date = defaultdict(float)
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

    # Calculate utilization rate as a percentage
    for date in utilization_by_date:
        utilization_by_date[date] = (
            utilization_by_date[date] / 24
        ) * 100  # Convert to percentage

    peak_chart_data = {
        "labels": [f"{i}:00 - {i+1}:00" for i in range(24)],
        "datasets": [{"label": "Number of Transactions", "data": hour_counts}],
    }

    data_pack = {"peak_time": peak_chart_data}

    return data_pack

'''@app.get("/example")
async def example_route(user: dict = require_permission("staff", "owner")):
    return {"message": "Hello, you have access", "user": user}'''


###########################################################################
# API Routes
###########################################################################

# Test Routes
'''@app.get("/")
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
'''

@app.get("/api/stations")
async def get_stations(owner_id: Optional[int] = None, user: dict = require_permission("staff", "owner", "driver")):
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
    user: dict = require_permission("staff", "owner", "driver")
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
        postal_code=postal
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
    user: dict = require_permission("staff", "owner", "driver")
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
        postal_code=postal
    )
    query_in = query_in.dict(exclude_none=True)
    #query_in["station_list"] = [station_id]
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
    user: dict = require_permission("staff", "owner", "driver")
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
        postal_code=postal
    )
    query_in = query_in.dict(exclude_none=True)
    transactions = get_transactions(query_in, user)
    # Generate charts from transactions
    if user.get("role") == "driver":
        return generate_peak(transactions)
    return generate_charts(transactions)

@app.get("/api/stations/analytics/charts/{station_id}")
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
    user: dict = require_permission("staff", "owner", "driver")
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
        postal_code=postal
    )
    query_in = query_in.dict(exclude_none=True)
    #query_in["station_list"] = [station_id]
    transactions = get_transactions(query_in, user)
    # Generate charts from transactions
    if user.get("role") == "driver":
        return generate_peak(transactions)
    return generate_charts(transactions)
    
@app.get("/api/stations/analytics/evse-status")
async def retrieve_evse_status(
    evse_id: Optional[int] = None,
    station_id: Optional[str] = None,
    user: dict = require_permission("staff", "owner", "driver")
    ):
    query_in = {
        "evse_id": evse_id,
        "station_id": station_id
    }
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
    user: dict = require_permission("staff", "owner", "driver")
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
        postal_code=postal
    )
    query_in = query_in.dict(exclude_none=True)

    transactions = get_transactions(query_in, user)
    #return transactions
    return forecast(transactions)

