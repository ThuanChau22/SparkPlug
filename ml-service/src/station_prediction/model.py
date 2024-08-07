import numpy as np
import pandas as pd
from joblib import load
from sklearn.tree import *
from scipy.optimize import minimize

from src.config import STATION_PREDICTION_MODEL_PATH
from src.utils import (
    get_charging_sessions_by_zip_code,
    get_stations_by_zip_code,
)


class StationPredictionModel:
    def __init__(self):
        self.model = load(STATION_PREDICTION_MODEL_PATH)

    def predict(self, zip_code):
        if not self.model.get(zip_code):
            raise Exception(f"Prediction for zipcode {zip_code} unavailable", 400)

        model = self.model[zip_code]

        charging_sessions = get_charging_sessions_by_zip_code(zip_code)
        charging_sessions_df = pd.DataFrame(charging_sessions).rename(
            columns={"energy_consumed_kwh": "energy_consumed"}
        )

        stations = get_stations_by_zip_code(zip_code)
        stations_df = pd.DataFrame(stations)
        stations_df["latitude"] = stations_df["latitude"].astype(float)
        stations_df["longitude"] = stations_df["longitude"].astype(float)

        # energy_consumed_by_station_mean = (
        #     charging_sessions_df.groupby("station_id")
        #     .agg({"energy_consumed": "sum"})
        #     .reset_index()
        # )["energy_consumed"].mean()

        # Estimate the number of new charging stations needed for each zip code
        latitude_min = stations_df["latitude"].min()
        latitude_max = stations_df["latitude"].max()
        longitude_min = stations_df["longitude"].min()
        longitude_max = stations_df["longitude"].max()
        latitude_mean = stations_df["latitude"].mean()
        longitude_mean = stations_df["longitude"].mean()
        energy_consumed_sum = charging_sessions_df["energy_consumed"].sum()
        estimated_new_stations = int(
            np.ceil(energy_consumed_sum / 50000)
        )  # Adjust the threshold as needed

        # Objective function to maximize total predicted demand
        def objective(locations):
            demand = 0
            for i in range(0, len(locations), 2):
                latitude, longitude = locations[i], locations[i + 1]
                dist = StationPredictionModel._haversine_distance(
                    latitude,
                    longitude,
                    latitude_mean,
                    longitude_mean,
                )
                demand += model.predict([[dist, 0]])[0]
            return -demand

        # Constraint to ensure minimum distance between stations
        def constraint(locations):
            min_distance = 5  # Minimum distance between stations in km
            num_constraints = 0
            for i in range(0, len(locations), 2):
                for j in range(i + 2, len(locations), 2):
                    lat1, lon1 = locations[i], locations[i + 1]
                    lat2, lon2 = locations[j], locations[j + 1]
                    distance = StationPredictionModel._haversine_distance(
                        lat1, lon1, lat2, lon2
                    )
                    if distance < min_distance:
                        num_constraints += 1
            return num_constraints

        locations = []
        if estimated_new_stations > 0:
            # Initial guess for station locations
            x0 = []
            for _ in range(estimated_new_stations):
                latitude = np.random.uniform(latitude_min, latitude_max)
                longitude = np.random.uniform(longitude_min, longitude_max)
                x0.extend([latitude, longitude])

            # Optimize station locations
            bounds = (
                (latitude_min, latitude_max),
                (longitude_min, longitude_max),
            )
            result = minimize(
                objective,
                x0,
                bounds=bounds * estimated_new_stations,
                constraints={"type": "eq", "fun": constraint},
            )

            # Extract optimized station locations
            for i in range(0, len(result.x), 2):
                latitude, longitude = result.x[i], result.x[i + 1]
                locations.append(
                    {
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                )

        return locations

    @staticmethod
    def _haversine_distance(lat_x, lon_x, lat_y, lon_y):
        R = 6371  # Earth's radius in km
        d_lat = np.radians(lat_y - lat_x)
        d_lon = np.radians(lon_y - lon_x)
        a = (
            np.sin(d_lat / 2) ** 2
            + np.cos(np.radians(lat_x))
            * np.cos(np.radians(lat_y))
            * np.sin(d_lon / 2) ** 2
        )
        c = 2 * np.arcsin(np.sqrt(a))
        return R * c
