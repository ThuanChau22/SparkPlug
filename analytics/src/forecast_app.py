import sys
import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, r2_score
from src.config import ENERGY_FORECAST_MODEL_PATH

def map_to_dataframe(data):
    # Define the mapping of keys to desired column names
    column_mapping = {
        "postal_code": "ZipCode",
        "station_name": "Charging Station",
        "city": "City",
        "state": "State",
        "latitude": "Latitude",
        "longitude": "Longitude",
        "start_date": "Start Date",
        "end_date": "End Date",
        "total_duration": "Total Duration",
        "charging_time": "Charging Time",
        "charge_level": "Charging Port Type",
        "evse_number": "Charging Ports",
        "plug_type": "Plug Type",
        "energy_consumed_kwh": "Energy Consumed",
        "fee": "Charges"
    }
    
    # Filter the data to only include the keys in column_mapping
    filtered_data = [
        {key: item[key] for key in column_mapping if key in item} for item in data
    ]
    
    # Create a DataFrame from the filtered list of dictionaries
    df = pd.DataFrame(filtered_data)
    
    # Rename the columns using the mapping
    df.rename(columns=column_mapping, inplace=True)
    
    return df

def json_to_df(json_data):
    df = map_to_dataframe(json_data)
    return df

def convert_duration(duration_str):
    parts = duration_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = int(parts[2])
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds

def process_data_for_prediction(json_data):
    # Convert the JSON data to a DataFrame
    df = json_to_df(json_data)

    # Convert 'Start Date' and 'End Date' to datetime format
    df['Start Date'] = pd.to_datetime(df['Start Date'])
    df['End Date'] = pd.to_datetime(df['End Date'], format='%m/%d/%y %H:%M', errors='coerce')

    # Convert 'Charging Time' and 'Total Duration' to timedelta and calculate z-scores
    df['Charging Time'] = pd.to_timedelta(df['Charging Time'])
    df['Total Duration'] = pd.to_timedelta(df['Total Duration'])
    
    # Calculate z-scores for 'Total Duration' and 'Charging Time'
    df['Total Duration_zscore'] = stats.zscore(df['Total Duration'].dt.total_seconds() / 3600)
    df['Charging Time_zscore'] = stats.zscore(df['Charging Time'].dt.total_seconds() / 3600)

    df['Start Date_ordinal'] = df['Start Date'].apply(lambda x: x.toordinal())
    df['Start Date_zscore'] = stats.zscore(df['Start Date_ordinal'])

    # Initialize LabelEncoder for categorical features
    label_encoder = LabelEncoder()

    # Apply label encoding to 'Charging Station', 'City', and 'State'
    df['Charging Station'] = label_encoder.fit_transform(df['Charging Station'])
    df['City'] = label_encoder.fit_transform(df['City'])
    df['State'] = label_encoder.fit_transform(df['State'])

    # Define features for prediction (assuming the same features as in training)
    X_new = df[['Charging Time_zscore', 'Start Date_zscore', 'Total Duration_zscore']]  # Features
    
    return X_new

def load_and_predict(json_data):
    # Load the pre-trained model
    xgb_model_loaded = joblib.load(ENERGY_FORECAST_MODEL_PATH)

    # Process the new data to match the format expected by the model
    X_new = process_data_for_prediction(json_data)

    # Use the loaded model to make predictions
    y_new_pred = xgb_model_loaded.predict(X_new)

    return y_new_pred

def forecast(json_data):
    # Get the predictions from the model
    predictions = load_and_predict(json_data)
    
    # Convert the predictions to a list (if they are not already)
    predictions_list = predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions)
    
    # Prepare the response in a returnable format
    response = {
        "predictions": predictions_list
    }
    
    return response
