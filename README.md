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

### Environment Variables (Optional)
Create a `.env` file in the `server/` directory:
```
PORT=4000
DB_PATH=./data.db
```

## API Endpoints
The REST API is ready with the following structure:
- `GET /api/health` - Health check endpoint
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/hospitals/register` - Hospital registration
- `POST /api/hospitals/login` - Hospital login
- Additional endpoints for appointments, doctors, etc.

## Features Status
✅ Project structure
✅ SQLite3 database connection
✅ REST API framework
✅ Dark theme UI
✅ Basic routing setup
⏳ Full feature implementation (pending)

## Development Notes
- The database file (`data.db`) is auto-generated on first run
- Frontend uses Vite for fast development
- Backend uses nodemon for auto-reload during development
- CORS is enabled for local development

## Next Steps
- Implement full authentication flow
- Add appointment booking logic
- Implement search and filtering
- Add doctor management
- Integrate map features
- Add real-time notifications

---
**Current Status**: Project scaffold ready for development
