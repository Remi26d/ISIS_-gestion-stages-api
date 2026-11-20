FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATABASE_PATH=/app/data/stages.sqlite3

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --requirement requirements.txt \
    && mkdir -p /app/data \
    && chown 10001:10001 /app/data

COPY app/ ./app/

USER 10001:10001
EXPOSE 8000

CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port \"${PORT:-8000}\""]
