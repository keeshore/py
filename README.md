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

### Environment Variables (server/.env)
```
PORT=4000
DB_PATH=./data.db
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
- Gemini integration is optional; missing API key returns a friendly message.
- Legacy React + Node assets remain for reference but Flask stack is the supported path now.
