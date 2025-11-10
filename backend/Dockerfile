# Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps (mutagen pure-Python; nothing special required)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# runtime directories
RUN mkdir -p /data /app/data

ENV VA_ROOT=/data/VA_Videos
ENV DB_PATH=/app/data/sfx.db
ENV SCAN_INTERVAL_SECONDS=60

EXPOSE 5000

CMD ["python", "app.py"]
