from flask import Flask, request
from flask_cors import CORS

from datetime import datetime
from src.config import WEB_DOMAIN
from src.middlewares import auth
from src.station_prediction.model import StationPredictionModel
from src.wait_time.model import WaitTimeModel
from src.utils import handle_error

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": WEB_DOMAIN}})


# Handle price prediction
@app.route("/api/station-prediction", methods=["GET"])
@auth.require_permission("staff", "owner")
def predict_station_location():
    try:
        # Read parameters
        zip_code = request.args.get("zip_code")

        # Validate parameters
        if not zip_code:
            raise Exception(f"zip_code is required", 400)
        try:
            zip_code = int(zip_code)
        except Exception as e:
            raise Exception(f"Invalid zip_code value", 400)

        model = StationPredictionModel()
        locations = model.predict(zip_code)
        return locations, 200
    except Exception as e:
        return handle_error(e)

@app.route("/api/wait-time", methods=["GET"])
@auth.require_permission("staff", "owner", "driver")
def predict_wait_time():
    try:
        # Parse query parameters
        evse_id = request.args.get("evse_id")
        station_id = request.args.get("station_id")
        latitude = request.args.get("latitude")
        longitude = request.args.get("longitude")
        hour_of_day = request.args.get("hour_of_day")
        day_of_week = request.args.get("day_of_week")
        elapsed_time = request.args.get("elapsed_time")

        # Validate required parameters
        required_params = [("evse_id", evse_id), ("station_id", station_id), ("latitude", latitude),
                           ("longitude", longitude), ("hour_of_day", hour_of_day), ("day_of_week", day_of_week),
                           ("elapsed_time", elapsed_time)]

        for name, val in required_params:
            if val is None:
                raise Exception(f"{name} is required", 400)

        # Convert parameters to numeric
        try:
            evse_id = float(evse_id)
            station_id = float(station_id)
            latitude = float(latitude)
            longitude = float(longitude)
            hour_of_day = int(hour_of_day)
            day_of_week = int(day_of_week)
            elapsed_time = float(elapsed_time)
        except ValueError:
            raise Exception("Invalid parameter type. Ensure numeric values where appropriate.", 400)

        # Load and predict using the WaitTimeModel
        model = WaitTimeModel()
        wait_time_estimate = model.predict(evse_id, station_id, latitude, longitude, hour_of_day, day_of_week, elapsed_time)

        return {"wait_time_estimate": wait_time_estimate}, 200
    except Exception as e:
        return handle_error(e)

@app.route("/api/wait-time/batch", methods=["POST"])
@auth.require_permission("staff", "owner", "driver")
def batch_wait_time():
    try:
        body = request.get_json()
        if not body or "data" not in body:
            raise Exception("Missing 'data' in request body", 400)

        data_entries = body["data"]
        if not isinstance(data_entries, list):
            raise Exception("'data' should be a list of EVSE entries", 400)

        # Generate hour_of_day and day_of_week from current system time
        now = datetime.now()
        hour_of_day = now.hour
        day_of_week = now.weekday()  # Monday=0, Sunday=6

        model = WaitTimeModel()

        results = []
        for entry in data_entries:
            station_id = entry.get("station_id")
            evse_id = entry.get("evse_id")
            latitude = entry.get("latitude")
            longitude = entry.get("longitude")
            status = entry.get("status")

            # Validate needed fields
            if station_id is None or evse_id is None or latitude is None or longitude is None or status is None:
                raise Exception("station_id, evse_id, latitude, longitude, and status are required", 400)

            # If not Occupied, wait_time = 0
            if status.lower() != "occupied":
                wait_time = 0
            else:
                # For Occupied, predict wait_time
                elapsed_time = 0
                predicted_total = model.predict(evse_id, station_id, latitude, longitude, hour_of_day, day_of_week, elapsed_time)
                wait_time = round(predicted_total - elapsed_time)

            results.append({
                "station_id": station_id,
                "evse_id": evse_id,
                "wait_time": wait_time
            })

        return {"data": results}, 200
    except Exception as e:
        return handle_error(e)

# Handle path not found
@app.errorhandler(404)
def path_not_found(_):
    message = f"The requested path {request.path} was not found on server."
    return {"message": message}, 404
