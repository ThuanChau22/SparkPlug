FROM python:3.10 AS development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir --upgrade -r requirements.txt
COPY . .
CMD ["fastapi", "run", "main.py", "--port", "8004"]

FROM development AS production
CMD ["fastapi", "run", "main.py", "--proxy-headers", "--port", "8004"]

