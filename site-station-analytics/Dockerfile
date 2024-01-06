FROM python:3.10 as development
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD ["python", "src/app.py"]

FROM development as production
CMD ["gunicorn", "-w", "2", "-c", "src/config.py", "--chdir", "src", "app:app"]
