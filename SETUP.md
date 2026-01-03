# Project Setup Guide for Appointment Booking System

## Quick Start (5 minutes)

### Step 1: Activate Virtual Environment

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Windows CMD
.venv\Scripts\activate.bat

# macOS/Linux
source .venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r server/requirements.txt
```

### Step 3: Create .env File

Copy and create `.env` in project root:

```
FLASK_ENV=development
FLASK_DEBUG=1
API_BASE=/api
PORT=4000
```

### Step 4: Run Application

```bash
python server/app.py
```

Visit: `http://localhost:4000`

---

## Project Structure

```
py/
├── server/
│   ├── app.py                      # Main Flask application
│   ├── db.py                       # Database initialization
│   ├── requirements.txt            # Python dependencies
│   ├── static/
│   │   ├── css/app.css            # Styling
│   │   └── js/app.js              # Frontend logic
│   └── templates/
│       ├── landing.html            # Home page
│       ├── user_login.html         # User login
│       ├── user_register.html      # User registration
│       ├── user_dashboard.html     # User dashboard
│       ├── hospital_login.html     # Hospital login
│       ├── hospital_register.html  # Hospital registration
│       ├── hospital_dashboard.html # Hospital dashboard
│       ├── book.html              # Appointment booking
│       ├── rebook.html            # Rebook appointment
│       ├── qr.html                # QR code display
│       ├── firstaid.html          # AI first aid
│       └── base.html              # Base template
├── .env                           # Local environment variables
├── .env.example                   # Environment template
├── Procfile                       # Railway deployment config
├── railway.json                   # Railway settings
└── README.md                      # Full documentation
```

---

## Available Routes

### Frontend Pages
- `/` - Landing page
- `/user/register` - User signup
- `/user/login` - User login
- `/user/dashboard` - User dashboard
- `/user/book` - Book appointment
- `/user/rebook` - Rebook appointment
- `/user/firstaid` - AI first aid assistance
- `/user/qr` - View QR code
- `/hospital/register` - Hospital signup
- `/hospital/login` - Hospital login
- `/hospital/dashboard` - Hospital dashboard

### API Endpoints

**Users:**
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/<id>`
- `PUT /api/users/<id>`

**Hospitals:**
- `POST /api/hospitals/register`
- `POST /api/hospitals/login`
- `GET /api/hospitals/<id>`
- `PUT /api/hospitals/<id>`

**Appointments:**
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/today`
- `PUT /api/appointments/<id>/cancel`
- `PUT /api/appointments/<id>/get-in`
- `PUT /api/appointments/<id>/complete`

**AI:**
- `POST /api/firstaid`

**Health:**
- `GET /api/health`

---

## Database

SQLite database (`app.db`) is automatically created in the `server/` directory on first run.

**Tables:**
- `users` - User accounts
- `hospitals` - Hospital details
- `appointments` - Booking records
- `firstaid_chats` - AI chat history

---

## Deployment (Railway)

1. Push to GitHub
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Flask and deploys
6. Set environment variables in Railway dashboard
7. Your app is live! 🚀

---

## Troubleshooting

**Virtual environment issues:**
```bash
# Recreate venv if issues
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
```

**Port already in use:**
Change PORT in .env to 5000 or another available port

**Database lock:**
Delete `server/app.db` and restart app

**Import errors:**
```bash
pip install --upgrade pip
pip install -r server/requirements.txt --force-reinstall
```

---

## Development Tips

- **Hot reload:** Changes to Python files auto-restart the server
- **Debug mode:** `FLASK_DEBUG=1` enables detailed error pages
- **CORS enabled:** API requests from any origin are allowed
- **Environment variables:** Change in `.env` and restart server

---

## File Sizes & Dependencies

- **Python packages:** Flask, python-dotenv, requests, Flask-Cors
- **Database:** SQLite (no external DB needed)
- **Frontend:** HTML, CSS, JavaScript (no build step needed)
- **Total size:** ~100MB with virtual environment

---

## Next Steps

1. ✅ Clone repository
2. ✅ Create virtual environment
3. ✅ Install dependencies
4. ✅ Create .env file
5. ✅ Run `python server/app.py`
6. ✅ Open `http://localhost:4000`
7. 📝 Test features (register, login, book appointment)
8. 🚀 Deploy to Railway

---

Happy coding! 🎉
