
FROM python:3.10-slim-bookworm@sha256:57038683f4a259e17fcff1ccef7ba30b1065f4b3317dabb5bd7c82640a5ed64f AS development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD ["python", "main.py"]

FROM development AS production
CMD ["gunicorn", "-w", "2", "-c", "src/config.py", "main:app"]
