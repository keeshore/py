import math
import os
import uuid
from datetime import datetime

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from db import close_db, get_all, get_one, init_db, run

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JSON_SORT_KEYS"] = False
app.config["API_BASE"] = os.environ.get("API_BASE", "/api")
app.config["GA_MEASUREMENT_ID"] = os.environ.get("GA_MEASUREMENT_ID", "")
app.config["GTM_CONTAINER_ID"] = os.environ.get("GTM_CONTAINER_ID", "")
app.config["GOOGLE_CALENDAR_EMBED_URL"] = os.environ.get("GOOGLE_CALENDAR_EMBED_URL", "")


def calc_age(dob: str | None) -> int | None:
    if not dob:
        return None
    try:
        birth = datetime.fromisoformat(dob)
    except ValueError:
        return None
    diff = datetime.utcnow() - birth
    return int(diff.days // 365.25)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    to_rad = lambda deg: (deg * math.pi) / 180
    r = 6371.0
    dlat = to_rad(lat2 - lat1)
    dlon = to_rad(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dlon / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def call_gemini(prompt: str) -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return "Gemini API key missing."
    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=20,
        )
        data = resp.json()
        if not resp.ok:
            detail = data.get("error", {}).get("message") or "Gemini API error"
            return f"Gemini API error: {detail}"
        return (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        ) or "No response received from Gemini."
    except requests.RequestException as exc:
        return f"Gemini request failed: {exc}"


@app.teardown_appcontext
def teardown_db(exc):
    close_db(exc)


@app.before_request
def ensure_db():
    if not getattr(app, "_db_initialized", False):
        init_db()
        app._db_initialized = True


@app.context_processor
def inject_analytics():
    return {
        "ga_measurement_id": app.config.get("GA_MEASUREMENT_ID", ""),
        "gtm_container_id": app.config.get("GTM_CONTAINER_ID", ""),
    }


@app.route("/")
def landing_page():
    return render_template("landing.html", page="landing", api_base=app.config["API_BASE"])


@app.route("/user/register")
def user_register_page():
    return render_template("user_register.html", page="user-register", api_base=app.config["API_BASE"])


@app.route("/user/login")
@app.route("/users/login")
def user_login_page():
    return render_template("user_login.html", page="user-login", api_base=app.config["API_BASE"])


@app.route("/user/dashboard")
def user_dashboard_page():
    return render_template("user_dashboard.html", page="user-dashboard", api_base=app.config["API_BASE"])


@app.route("/user/book")
def user_book_page():
    return render_template("book.html", page="book", api_base=app.config["API_BASE"])


@app.route("/user/rebook")
def user_rebook_page():
    return render_template("rebook.html", page="rebook", api_base=app.config["API_BASE"])


@app.route("/user/firstaid")
def user_firstaid_page():
    return render_template("firstaid.html", page="firstaid", api_base=app.config["API_BASE"])


@app.route("/user/qr")
def user_qr_page():
    return render_template("qr.html", page="qr", api_base=app.config["API_BASE"])


@app.route("/hospital/register")
def hospital_register_page():
    return render_template("hospital_register.html", page="hospital-register", api_base=app.config["API_BASE"])


@app.route("/hospital/login")
def hospital_login_page():
    return render_template("hospital_login.html", page="hospital-login", api_base=app.config["API_BASE"])


@app.route("/hospital/dashboard")
def hospital_dashboard_page():
    return render_template("hospital_dashboard.html", page="hospital-dashboard", api_base=app.config["API_BASE"])


@app.route("/doctor/dashboard")
def doctor_dashboard_page():
    return render_template(
        "doctor_dashboard.html",
        page="doctor-dashboard",
        api_base=app.config["API_BASE"],
        google_calendar_embed_url=app.config["GOOGLE_CALENDAR_EMBED_URL"],
    )


@app.route("/hospital/<hospital_id>")
def hospital_public_page(hospital_id: str):
    return render_template(
        "hospital_view.html",
        page="hospital-view",
        hospital_id=hospital_id,
        api_base=app.config["API_BASE"],
    )


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "timestamp": datetime.utcnow().isoformat()})


@app.post("/api/users/register")
def register_user():
    try:
        data = request.get_json(force=True) or {}
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"error": "Missing required fields"}), 400

        exists = get_one("SELECT id FROM users WHERE email = ?", (email,))
        if exists:
            return jsonify({"error": "Email already registered"}), 400

        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        age = calc_age(data.get("dob"))

        run(
            """
            INSERT INTO users (id, name, email, mobile, password_hash, height, weight, dob, age, address, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                name,
                email,
                data.get("mobile"),
                password_hash,
                data.get("height"),
                data.get("weight"),
                data.get("dob"),
                age,
                data.get("address"),
                data.get("latitude"),
                data.get("longitude"),
            ),
        )

        user = get_one("SELECT * FROM users WHERE id = ?", (user_id,))
        return jsonify({"user": user})
    except Exception as exc:  # pragma: no cover - defensive
        # Log full traceback to the Flask logger for debugging
        app.logger.exception("Error in register_user")
        return jsonify({"error": f"Server error while registering user: {exc}"}), 500


@app.post("/api/users/login")
def login_user():
    try:
        data = request.get_json(force=True) or {}
        user = get_one("SELECT * FROM users WHERE email = ?", (data.get("email"),))

        if not user or not check_password_hash(user["password_hash"], data.get("password", "")):
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"user": user})
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.exception("Error in login_user")
        return jsonify({"error": f"Server error while logging in: {exc}"}), 500


# ---- REST OF CODE (Hospitals, Doctors, Appointments, FirstAid) ----
# ❌ NO OTHER LOGIC CHANGED
# ✅ ONLY reCAPTCHA REMOVED
