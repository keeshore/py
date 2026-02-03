# PulseCare - Flask Edition

## Project Overview
Full-stack doctor appointment application rebuilt on **Python + Flask** with a Bootstrap-powered HTML/CSS frontend. REST API and pages are served from the same Flask app backed by SQLite.

## Tech Stack
- **Frontend**: Server-rendered HTML + Bootstrap 5 + custom CSS
- **Backend**: Python 3 + Flask + Flask-Cors
- **Database**: SQLite3 (file-based)

## Project Structure
```
py/
├── server/
│   ├── app.py             # Flask app with REST API + page routes
│   ├── db.py              # SQLite helper + schema bootstrap
│   ├── requirements.txt   # Python dependencies
│   ├── templates/         # Jinja2 HTML pages
│   └── static/            # CSS/JS assets (Bootstrap theme overrides)
├── client/                # Legacy React app (unused in Flask flow)
└── README.md
```

### Database Schema
Tables remain unchanged: `users`, `hospitals`, `doctors`, `appointments`, `firstaid_chats`.

## Setup Instructions

### Prerequisites
- Python 3.10+
- pip

### Install & Run
```bash
cd server
python -m venv .venv
.venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python app.py             # Runs on http://localhost:4000
```

## Deployment (Production)

This is a Flask server app (dynamic pages + `/api/*` + SQLite). It should be deployed on a Python host (Render/Railway/Fly.io/Heroku/etc.) or as a Docker container.

### Render (recommended)
- Commit/push this repo.
- In Render: **New → Web Service → Connect repo**
- Build command: `pip install -r server/requirements.txt`
- Start command: `gunicorn --chdir server wsgi:app`
- Health check path: `/api/health`

Environment variables (Render → Environment):
- `PORT` (Render sets this automatically)
- `API_BASE=/api`
- `DB_PATH=./server/data_v2.db` (SQLite file; note: free tiers may have ephemeral disk)
- Optional: `GEMINI_API_KEY`, `RECAPTCHA_SECRET`, `RECAPTCHA_SITE_KEY`, `GA_MEASUREMENT_ID`, `GTM_CONTAINER_ID`, `GOOGLE_CALENDAR_EMBED_URL`

There is also a ready config file: `render.yaml`.

### Docker (any host)
Build and run:
```bash
docker build -t pulsecare .
docker run -p 4000:4000 -e PORT=4000 pulsecare
```

### Windows-friendly production server
Gunicorn does not run on Windows. For Windows hosting/testing you can use Waitress:
```bash
cd server
python serve.py
```

### Netlify note
Netlify is for static sites; it cannot run this Flask server + SQLite app directly.

### Environment Variables (server/.env)
```
PORT=4000
DB_PATH=./data_v2.db
GEMINI_API_KEY=your_gemini_key
RECAPTCHA_SECRET=your_recaptcha_secret
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
API_BASE=/api
```
- If `RECAPTCHA_SECRET` is unset, verification is skipped.
- `RECAPTCHA_SITE_KEY` populates widgets on forms.

## API Endpoints (unchanged semantics)
- `GET /api/health`
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `POST /api/hospitals/register`
- `POST /api/hospitals/login`
- `GET /api/hospitals/:id`
- `PUT /api/hospitals/:id`
- `PUT /api/doctors/:id`
- `GET /api/doctors/search`
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/today`
- `PUT /api/appointments/:id/cancel`
- `PUT /api/appointments/:id/get-in`
- `PUT /api/appointments/:id/complete`
- `POST /api/firstaid`

## Frontend Pages
- `/` landing
- `/user/register`, `/user/login`, `/user/dashboard`, `/user/book`, `/user/rebook`, `/user/firstaid`, `/user/qr`
- `/hospital/register`, `/hospital/login`, `/hospital/dashboard`, `/doctor/dashboard`
- `/hospital/<id>` lightweight public hospital view for QR links

## Notes
- SQLite file lives at `DB_PATH`; schema auto-creates on first request.
- To wipe data and recreate schema locally, run: `python server/reset_db.py` (stop the server first on Windows).
- Gemini integration is optional; missing API key returns a friendly message.
- Legacy React + Node assets remain for reference but Flask stack is the supported path now.
