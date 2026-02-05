FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PORT=4000 \
	HOST=0.0.0.0 \
	API_BASE=/api

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip \
	&& python -m pip install --no-cache-dir -r requirements.txt

COPY . ./

EXPOSE 4000

CMD gunicorn --bind 0.0.0.0:${PORT} wsgi:app