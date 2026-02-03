# Minimal container for PulseCare (Flask + SQLite)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

# Copy app
COPY server /app/server

# Render/Heroku style platforms set PORT automatically
ENV PORT=4000
EXPOSE 4000

CMD ["gunicorn", "--chdir", "server", "--bind", "0.0.0.0:${PORT}", "wsgi:app"]
