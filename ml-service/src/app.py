from flask import Flask, request
from flask_cors import CORS

from src.config import WEB_DOMAIN
from src.middlewares import auth
from src.station_prediction.model import StationPredictionModel
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


# Handle path not found
@app.errorhandler(404)
def path_not_found(_):
    message = f"The requested path {request.path} was not found on server."
    return {"message": message}, 404
