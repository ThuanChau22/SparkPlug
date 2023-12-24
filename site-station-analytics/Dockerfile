FROM python:3.10 as development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD ["python", "src/server.py"]

FROM development as production
CMD ["gunicorn", "-w", "2", "--chdir", "src", "server:app"]
