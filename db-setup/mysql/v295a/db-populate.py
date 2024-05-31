import pandas as pd
import os
from dotenv import load_dotenv
import random
import mysql.connector
from mysql.connector import Error

def calculate_station_coordinates(base_lat, base_lon, station_index, total_stations):
    # Calculate row and column in a square grid
    grid_size = int(total_stations**0.5) + 1
    row = (station_index - 1) // grid_size
    col = (station_index - 1) % grid_size

    # Calculate the offset
    offset = 0.000022
    new_lat = base_lat + (offset * row) - (offset * grid_size / 2)
    new_lon = base_lon + (offset * col) - (offset * grid_size / 2)

    return new_lat, new_lon

# Load environment variables from .env file
load_dotenv()

# Get the connection parameters from environment variables
host = os.getenv("DB_HOST")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
database = os.getenv("DB_DATABASE")

# Create a connection to the MySQL database
connection = mysql.connector.connect(
    host=host,
    user=user,
    password=password,
    database=database
)

# Read the CSV file into a dataframe
file_path = 'data/g6stations.csv'
df = pd.read_csv(file_path)

# Handle missing values (NaN) in the dataframe
df = df.fillna('')

# Sort the dataframe by the "ID" column
df = df.sort_values(by='ID')

try:
    # Create a cursor object
    cursor = connection.cursor()

    # Iterate through each row of the dataframe
    for index, row in df.iterrows():
        # Generate a random owner_id between 1 and 10
        owner_id = random.randint(1, 10)
        
        # Extract the values from the row
        ID = row['ID']
        Latitude = row['Latitude']
        Longitude = row['Longitude']
        Station_Name = row['Station Name']
        Street_Address = row['Street Address']
        ZIP = row['ZIP']
        City = row['City']
        State = row['State']
        
        # Insert the values into the Site table
        query = "INSERT INTO Site (id, owner_id, latitude, longitude, name, street_address, zip_code, city, state) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        values = (ID, owner_id, Latitude, Longitude, Station_Name, Street_Address, ZIP, City, State)
        
        try:
            cursor.execute(query, values)
        except Error as e:
            print(f"Error: {e}")
        
        # Commit in batches
        if index % 100 == 0:
            connection.commit()

        # Calculate the total number of stations for this site
        level1_count = int(row['EV Level1 EVSE Num'] or 0)
        level2_count = int(row['EV Level2 EVSE Num'] or 0)
        dc_fast_count = int(row['EV DC Fast Count'] or 0)
        total_stations = level1_count + level2_count + dc_fast_count

        # Connector types mapping based on charge level
        connector_types_map = {
            1: ['J1772', 'NEMA515', 'NEMA520'],
            2: ['J1772', 'TESLA'],
            3: ['CHADEMO', 'J1772COMBO', 'TESLA']
        }

        # Current site connector types
        site_connector_types = row['EV Connector Types'].split()

        # Initialize station index
        station_index = 1

        # Generate stations
        for level, count in [(1, level1_count), (2, level2_count), (3, dc_fast_count)]:
            for _ in range(count):
                # Station details
                name = f"{row['Station Name']} {station_index}"
                charge_level = level
                connector_types = ' '.join([ct for ct in connector_types_map[level] if ct in site_connector_types])
                latitude, longitude = calculate_station_coordinates(row['Latitude'], row['Longitude'], station_index, total_stations)
                site_id = row['ID']

                # Insert station into the database
                station_query = "INSERT INTO Station (name, charge_level, connector_type, latitude, longitude, site_id) VALUES (%s, %s, %s, %s, %s, %s)"
                station_values = (name, charge_level, connector_types, latitude, longitude, site_id)
                cursor.execute(station_query, station_values)

                # Increment station index
                station_index += 1

        # Commit after handling each site
        connection.commit()

    # Final commit for remaining rows
    connection.commit()
finally:
    # Close cursor and connection
    cursor.close()
    connection.close()