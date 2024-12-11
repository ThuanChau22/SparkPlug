import pickle
import pandas as pd
import os

from src.config import WAIT_TIME_MODEL_PATH

class WaitTimeModel:
    def __init__(self):
        # Load the model once when the class is initialized
        with open(WAIT_TIME_MODEL_PATH, 'rb') as f:
            self.model = pickle.load(f)

    def predict(self, evse_id, station_id, latitude, longitude, hour_of_day, day_of_week, elapsed_time):
        # Create the input DataFrame
        input_data = {
            'evse_id': [evse_id],
            'station_id': [station_id],
            'latitude': [latitude],
            'longitude': [longitude],
            'hour_of_day': [hour_of_day],
            'day_of_week': [day_of_week]
        }

        df = pd.DataFrame(input_data, columns=['evse_id', 'station_id', 'latitude', 'longitude', 'hour_of_day', 'day_of_week'])

        # Predict the total duration
        predicted_total = self.model.predict(df)[0]

        # Compute wait time
        # wait_time_estimate = predicted_total - elapsed_time
        return predicted_total
