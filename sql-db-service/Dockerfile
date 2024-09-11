FROM python:3.10 AS development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD ["python", "src/sql_app.py"]

FROM development AS production
CMD ["gunicorn", "-w", "2", "-c", "src/config.py", "--chdir", "src", "app:app"]
