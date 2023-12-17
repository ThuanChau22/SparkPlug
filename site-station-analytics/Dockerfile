# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory in the container
WORKDIR /app

# Install any needed packages specified in requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Run app.py when the container launches
CMD ["python", "src/server.py"]
