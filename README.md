# Appointment Booking System

A Flask-based healthcare appointment booking system with hospitals, users, and first aid AI assistance.

## Features

- **User Management** - Register and login for appointment booking
- **Hospital Management** - Hospital registration and dashboard
- **Appointment Booking** - Book, cancel, and track appointments
- **First Aid AI** - AI-powered first aid guidance using Google Gemini API
- **Location-Based Search** - Find hospitals near you
- **QR Code Support** - Digital appointment QR codes

## Tech Stack
- **Frontend**: Bootstrap 5 + custom CSS/JavaScript
- **Backend**: Python 3 + Flask + Flask-Cors
- **Database**: SQLite3 (file-based)

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Quick Start (5 minutes)

### 1. Clone & Setup

```bash
git clone https://github.com/keeshore/py.git
cd py
```

### 2. Create Virtual Environment

**Windows PowerShell:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows CMD:**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r server/requirements.txt
```

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
FLASK_ENV=development
FLASK_DEBUG=1
API_BASE=/api
PORT=4000
```

### 5. Run Application

```bash
python server/app.py
```

Visit: **http://localhost:4000** 🚀

## Project Structure

```
py/
├── server/
│   ├── app.py              # Flask app
│   ├── db.py               # Database setup
│   ├── requirements.txt    # Dependencies
│   ├── static/             # CSS & JS
│   └── templates/          # HTML pages
├── .env                    # Environment variables
├── .env.example            # Environment template
├── Procfile                # Railway deployment
├── SETUP.md                # Detailed setup guide
└── README.md               # This file
```

## Available Pages

- `/` - Landing page
- `/user/register` - User signup
- `/user/login` - User login
- `/user/dashboard` - Appointments & profile
- `/user/book` - Book new appointment
- `/user/rebook` - Reschedule appointment
- `/user/firstaid` - AI first aid assistant
- `/hospital/register` - Hospital signup
- `/hospital/login` - Hospital login
- `/hospital/dashboard` - Manage appointments

## API Endpoints

**Users:** `POST /api/users/register`, `POST /api/users/login`, `GET/PUT /api/users/<id>`

**Hospitals:** `POST /api/hospitals/register`, `POST /api/hospitals/login`, `GET/PUT /api/hospitals/<id>`

**Appointments:** `POST /api/appointments`, `GET /api/appointments`, `PUT /api/appointments/<id>/cancel|get-in|complete`

**AI:** `POST /api/firstaid`

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Select repository
5. Railway auto-detects Flask
6. Set environment variables
7. Done! 🎉

The `Procfile` and `railway.json` are configured for Railway deployment.

## Environment Variables

```env
# Required
FLASK_ENV=development
FLASK_DEBUG=1              # Set to 0 in production
API_BASE=/api
PORT=4000

# Optional (for full features)
GEMINI_API_KEY=your_key    # Google Gemini API
RECAPTCHA_SITE_KEY=your_key
RECAPTCHA_SECRET=your_secret
```

## Database

SQLite database (`app.db`) auto-initializes on first run in `server/` directory.

Tables: `users`, `hospitals`, `appointments`, `firstaid_chats`

## Troubleshooting

**Port in use:** Change PORT in `.env` to 5000

**Database error:** Delete `server/app.db` and restart

**Import error:** 
```bash
pip install --upgrade pip
pip install -r server/requirements.txt --force-reinstall
```

## Documentation

See [SETUP.md](SETUP.md) for detailed setup instructions.

## License

MIT
