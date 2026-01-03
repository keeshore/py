# PulseCare - Doctor Appointment Web Application

## Project Overview
A full-stack Doctor Appointment Web Application with clean architecture separation.

## Tech Stack
- **Frontend**: React + Vite + HTML + CSS (Dark theme, high contrast)
- **Backend**: Node.js + Express (REST API)
- **Database**: SQLite3

## Project Structure
```
py/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── main.jsx       # App entry point
│   │   ├── App.jsx        # Main app component
│   │   ├── styles.css     # Dark theme styles
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── state/         # State management
│   │   └── lib/           # Utility functions
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Backend API
│   ├── server.js          # Express server
│   ├── db.js              # SQLite3 database setup
│   ├── package.json
│   └── data.db            # SQLite database file (auto-generated)
│
└── README.md              # This file
```

## Database Schema
The SQLite3 database includes tables for:
- **users**: Patient information
- **hospitals**: Hospital/clinic information
- **doctors**: Doctor profiles
- **appointments**: Appointment bookings
- **firstaid_chats**: Chat history (optional feature)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install Backend Dependencies**
```bash
cd server
npm install
```

2. **Install Frontend Dependencies**
```bash
cd client
npm install
```

### Running the Application

1. **Start the Backend Server**
```bash
cd server
npm run dev
```
Server will run on: `http://localhost:4000`

2. **Start the Frontend (in a new terminal)**
```bash
cd client
npm run dev
```
Frontend will run on: `http://localhost:5173`

### Environment Variables

Server (`server/.env`):
```
PORT=4000
DB_PATH=./data.db
GEMINI_API_KEY=your_gemini_key
RECAPTCHA_SECRET=your_recaptcha_secret
```

Client (`client/.env`):
```
VITE_API_BASE=https://py-backend-w56c.onrender.com/api
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

## API Endpoints
The REST API is ready with the following structure:
- `GET /api/health` - Health check endpoint
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/hospitals/register` - Hospital registration
- `POST /api/hospitals/login` - Hospital login
- Additional endpoints for appointments, doctors, etc.

## Docker Deployment (one command)

Prereqs: Docker + Docker Compose.

```
docker compose up --build
```

What it does:
- Builds server (Express + SQLite) and exposes `4000`.
- Builds client (Vite -> static) and serves via Nginx on host port `5173`.
- Uses volume `server-data` to persist `data.db` at `/data/data.db` inside the server container.

Environment overrides for Compose (optional):
```
GEMINI_API_KEY=...
RECAPTCHA_SECRET=...
VITE_API_BASE=https://py-backend-w56c.onrender.com/api
VITE_RECAPTCHA_SITE_KEY=...
```

## Production Notes
- Use HTTPS for ReCAPTCHA and API calls.
- Keep secrets in environment variables, not in source.
- If you move to Postgres, replace `sql.js` with a server DB client and remove the file-based DB.
- For static hosting without Docker, run `npm run build` in `client` and deploy `client/dist` to a CDN; point `VITE_API_BASE` at your deployed API.
