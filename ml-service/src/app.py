from flask import Flask, request
from flask_cors import CORS

from datetime import datetime
from src.config import WEB_DOMAINS
from src.middlewares import auth
from src.station_prediction.model import StationPredictionModel
from src.wait_time.model import WaitTimeModel
from src.utils import handle_error

app = Flask(__name__)
app.json.sort_keys = False
CORS(app, resources={r"/api/*": {"origins": WEB_DOMAINS}})


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
        required_params = [
            ("evse_id", evse_id),
            ("station_id", station_id),
            ("latitude", latitude),
            ("longitude", longitude),
            ("hour_of_day", hour_of_day),
            ("day_of_week", day_of_week),
            ("elapsed_time", elapsed_time),
        ]

        for name, val in required_params:
            if val is None:
                raise Exception(f"{name} is required", 400)

        # Convert parameters to numeric
        try:
            evse_id = int(evse_id)
            station_id = int(station_id)
            latitude = float(latitude)
            longitude = float(longitude)
            hour_of_day = int(hour_of_day)
            day_of_week = int(day_of_week)
            elapsed_time = int(elapsed_time)
        except ValueError:
            raise Exception(
                "Invalid parameter type. Ensure numeric values where appropriate.", 400
            )

        # Load and predict using the WaitTimeModel
        model = WaitTimeModel()
        wait_time_estimate = model.predict(
            evse_id,
            station_id,
            latitude,
            longitude,
            hour_of_day,
            day_of_week,
            elapsed_time,
        )

        return {"wait_time_estimate": wait_time_estimate}, 200
    except Exception as e:
        return handle_error(e)


@app.route("/api/wait-time/batch", methods=["POST"])
@auth.require_permission("staff", "owner", "driver")
def batch_wait_time():
    try:
        body = request.get_json()
        if not body:
            raise Exception("Invalid request body", 400)

        model = WaitTimeModel()
        wait_times = []
        for entry in body:
            args = {}
            for field in [
                "station_id",
                "evse_id",
                "latitude",
                "longitude",
                "hour_of_day",
                "day_of_week",
            ]:
                value = entry.get(field)
                if value is None:
                    raise Exception(f"{field} is required", 400)
                args[field] = entry.get(field)

            args["elapsed_time"] = 0
            wait_time_estimate = model.predict(
                station_id=args.get("station_id"),
                evse_id=args.get("evse_id"),
                latitude=args.get("latitude"),
                longitude=args.get("longitude"),
                hour_of_day=args.get("hour_of_day"),
                day_of_week=args.get("day_of_week"),
                elapsed_time=args.get("elapsed_time"),
            )
            wait_times.append(
                {
                    "station_id": args["station_id"],
                    "evse_id": args["evse_id"],
                    "wait_time": wait_time_estimate,
                }
            )

        return wait_times, 200
    except Exception as e:
        return handle_error(e)


# Handle path not found
@app.errorhandler(404)
def path_not_found(_):
    message = f"The requested path {request.path} was not found on server."
    return {"message": message}, 404
