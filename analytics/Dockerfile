FROM python:3.10 AS development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt
COPY . .
CMD ["python", "main.py"]

FROM development AS production
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app"]
