from flask import Flask, request
from flask_cors import CORS

# Internal Modules
from src.config import WEB_DOMAINS
from src.middlewares import auth
from src.controllers import site
from src.controllers import station
from src.controllers import evse


# Flash App
app = Flask(__name__)
app.json.sort_keys = False
CORS(app, resources={r"/api/*": {"origins": WEB_DOMAINS}})


########## Site Management Routes
@app.route("/api/sites", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_sites():
    return site.get_sites()


@app.route("/api/sites/locations", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_site_locations():
    return site.get_site_locations()


@app.route("/api/sites/<int:site_id>", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_site_by_id(site_id):
    return site.get_site_by_id(site_id)


@app.route("/api/sites", methods=["POST"])
@auth.require_permission("staff", "owner")
def create_site():
    return site.create_site()


@app.route("/api/sites/<int:site_id>", methods=["PATCH"])
@auth.require_permission("staff", "owner")
def update_site(site_id):
    return site.update_site(site_id)


@app.route("/api/sites/<int:site_id>", methods=["DELETE"])
@auth.require_permission("staff", "owner")
def delete_site(site_id):
    return site.delete_site(site_id)


########## Station Management Routes
@app.route("/api/stations", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_stations():
    return station.get_stations()


@app.route("/api/stations/<int:station_id>", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_station_by_id(station_id):
    return station.get_station_by_id(station_id)


@app.route("/api/stations", methods=["POST"])
@auth.require_permission("staff", "owner")
def create_station():
    return station.create_station()


@app.route("/api/stations/<int:station_id>", methods=["PATCH"])
@auth.require_permission("staff", "owner")
def update_station(station_id):
    return station.update_station(station_id)


@app.route("/api/stations/<int:station_id>", methods=["DELETE"])
@auth.require_permission("staff", "owner")
def delete_station(station_id):
    return station.delete_station(station_id)


########## EVSE Management Routes
@app.route("/api/stations/evses", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_evses():
    return evse.get_evses()


@app.route("/api/stations/<int:station_id>/evses", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_evses_by_station(station_id):
    return evse.get_evses_by_station(station_id)


@app.route("/api/stations/<int:station_id>/evses/<int:evse_id>", methods=["GET"])
@auth.require_permission("anonymous", "staff", "owner", "driver")
def get_evse_by_id(station_id, evse_id):
    return evse.get_evse_by_id(station_id, evse_id)


@app.route("/api/stations/<int:station_id>/evses", methods=["POST"])
@auth.require_permission("staff", "owner")
def create_evse(station_id):
    return evse.create_evse(station_id)


@app.route("/api/stations/<int:station_id>/evses/<int:evse_id>", methods=["PATCH"])
@auth.require_permission("staff", "owner")
def update_evse(station_id, evse_id):
    return evse.update_evse(station_id, evse_id)


@app.route("/api/stations/<int:station_id>/evses/<int:evse_id>", methods=["DELETE"])
@auth.require_permission("staff", "owner")
def delete_evse(station_id, evse_id):
    return evse.delete_evse(station_id, evse_id)


# Handle path not found
@app.errorhandler(404)
def path_not_found(_):
    message = f"The requested path {request.path} was not found on server."
    return {"message": message}, 404
