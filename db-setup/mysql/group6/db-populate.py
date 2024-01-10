import pandas as pd
import os
from dotenv import load_dotenv
import mysql.connector

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

# Print the dataframe
print(df.head)

