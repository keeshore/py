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
<<<<<<< HEAD
=======
app.config["GA_MEASUREMENT_ID"] = os.environ.get("GA_MEASUREMENT_ID", "")
app.config["GTM_CONTAINER_ID"] = os.environ.get("GTM_CONTAINER_ID", "")
app.config["GOOGLE_CALENDAR_EMBED_URL"] = os.environ.get("GOOGLE_CALENDAR_EMBED_URL", "")
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


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

<<<<<<< HEAD
=======

>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5
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
<<<<<<< HEAD
    return render_template(
        "landing.html",
        page="landing",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("landing.html", page="landing", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/register")
def user_register_page():
<<<<<<< HEAD
    return render_template(
        "user_register.html",
        page="user-register",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("user_register.html", page="user-register", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/login")
@app.route("/users/login")
def user_login_page():
<<<<<<< HEAD
    return render_template(
        "user_login.html",
        page="user-login",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("user_login.html", page="user-login", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/dashboard")
def user_dashboard_page():
<<<<<<< HEAD
    return render_template(
        "user_dashboard.html",
        page="user-dashboard",
                api_base=app.config["API_BASE"],
    )
=======
    return render_template("user_dashboard.html", page="user-dashboard", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/book")
def user_book_page():
<<<<<<< HEAD
    return render_template(
        "book.html",
        page="book",
                api_base=app.config["API_BASE"],
    )
=======
    return render_template("book.html", page="book", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/rebook")
def user_rebook_page():
<<<<<<< HEAD
    return render_template(
        "rebook.html",
        page="rebook",
                api_base=app.config["API_BASE"],
    )
=======
    return render_template("rebook.html", page="rebook", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/firstaid")
def user_firstaid_page():
<<<<<<< HEAD
    return render_template(
        "firstaid.html",
        page="firstaid",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("firstaid.html", page="firstaid", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/user/qr")
def user_qr_page():
<<<<<<< HEAD
    return render_template(
        "qr.html",
        page="qr",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("qr.html", page="qr", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/hospital/register")
def hospital_register_page():
<<<<<<< HEAD
    return render_template(
        "hospital_register.html",
        page="hospital-register",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("hospital_register.html", page="hospital-register", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/hospital/login")
def hospital_login_page():
<<<<<<< HEAD
    return render_template(
        "hospital_login.html",
        page="hospital-login",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("hospital_login.html", page="hospital-login", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/hospital/dashboard")
def hospital_dashboard_page():
<<<<<<< HEAD
    return render_template(
        "hospital_dashboard.html",
        page="hospital-dashboard",
        api_base=app.config["API_BASE"],
    )
=======
    return render_template("hospital_dashboard.html", page="hospital-dashboard", api_base=app.config["API_BASE"])
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.route("/doctor/dashboard")
def doctor_dashboard_page():
    return render_template(
        "doctor_dashboard.html",
        page="doctor-dashboard",
        api_base=app.config["API_BASE"],
<<<<<<< HEAD
=======
        google_calendar_embed_url=app.config["GOOGLE_CALENDAR_EMBED_URL"],
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5
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
<<<<<<< HEAD
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
            data.get("email"),
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
=======
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
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.post("/api/users/login")
def login_user():
<<<<<<< HEAD
    data = request.get_json(force=True) or {}
    user = get_one("SELECT * FROM users WHERE email = ?", (data.get("email"),))
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    if not check_password_hash(user["password_hash"], data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"user": user})
=======
    try:
        data = request.get_json(force=True) or {}
        user = get_one("SELECT * FROM users WHERE email = ?", (data.get("email"),))
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5

        if not user or not check_password_hash(user["password_hash"], data.get("password", "")):
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"user": user})
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.exception("Error in login_user")
        return jsonify({"error": f"Server error while logging in: {exc}"}), 500


@app.post("/api/hospitals/register")
def register_hospital():
<<<<<<< HEAD
    data = request.get_json(force=True) or {}
    if not data.get("name") or not data.get("email") or not data.get("password") or not data.get("doctorName"):
        return jsonify({"error": "Missing required fields"}), 400
    exists = get_one("SELECT id FROM hospitals WHERE email = ?", (data.get("email"),))
    if exists:
        return jsonify({"error": "Email already registered"}), 400
    hospital_id = str(uuid.uuid4())
    doctor_id = str(uuid.uuid4())
    password_hash = generate_password_hash(data.get("password"))
    run(
        """
        INSERT INTO hospitals (id, name, email, password_hash, emergency, morning_from, morning_to, evening_from, evening_to, address, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            hospital_id,
            data.get("name"),
            data.get("email"),
            password_hash,
            1 if data.get("emergency") else 0,
            data.get("morningFrom"),
            data.get("morningTo"),
            data.get("eveningFrom"),
            data.get("eveningTo"),
            data.get("address"),
            data.get("latitude"),
            data.get("longitude"),
        ),
    )
    run(
        """
        INSERT INTO doctors (id, hospital_id, name, qualification, specialization, description, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            doctor_id,
            hospital_id,
            data.get("doctorName"),
            data.get("doctorQualification"),
            data.get("doctorSpecialization"),
            data.get("doctorDescription"),
            data.get("latitude"),
            data.get("longitude"),
        ),
    )
    hospital = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    doctor = get_one("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
    hospital["doctor"] = doctor
    return jsonify({"hospital": hospital, "doctor": doctor})
=======
    """Register a hospital and its primary doctor.

    This version does NOT require reCAPTCHA. It expects the same
    payload shape that the frontend sends from hospital_register.html.
    """
    try:
        data = request.get_json(force=True) or {}

        required = ["name", "email", "password", "doctorName"]
        if any(not data.get(f) for f in required):
            return jsonify({"error": "Missing required fields"}), 400

        existing = get_one("SELECT id FROM hospitals WHERE email = ?", (data.get("email"),))
        if existing:
            return jsonify({"error": "Email already registered"}), 400

        hospital_id = str(uuid.uuid4())
        doctor_id = str(uuid.uuid4())
        password_hash = generate_password_hash(data.get("password"))

        run(
            """
            INSERT INTO hospitals (id, name, email, password_hash, emergency, morning_from, morning_to, evening_from, evening_to, address, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                hospital_id,
                data.get("name"),
                data.get("email"),
                password_hash,
                1 if data.get("emergency") else 0,
                data.get("morningFrom"),
                data.get("morningTo"),
                data.get("eveningFrom"),
                data.get("eveningTo"),
                data.get("address"),
                data.get("latitude"),
                data.get("longitude"),
            ),
        )

        run(
            """
            INSERT INTO doctors (id, hospital_id, name, qualification, specialization, description, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doctor_id,
                hospital_id,
                data.get("doctorName"),
                data.get("doctorQualification"),
                data.get("doctorSpecialization"),
                data.get("doctorDescription"),
                data.get("latitude"),
                data.get("longitude"),
            ),
        )

        hospital = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
        doctor = get_one("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
        hospital["doctor"] = doctor
        return jsonify({"hospital": hospital, "doctor": doctor})
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.exception("Error in register_hospital")
        return jsonify({"error": f"Server error while registering hospital: {exc}"}), 500
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5


@app.post("/api/hospitals/login")
def login_hospital():
<<<<<<< HEAD
    data = request.get_json(force=True) or {}
    hospital = get_one("SELECT * FROM hospitals WHERE email = ?", (data.get("email"),))
    if not hospital:
        return jsonify({"error": "Invalid credentials"}), 401
    if not check_password_hash(hospital["password_hash"], data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    doctor = get_one("SELECT * FROM doctors WHERE hospital_id = ?", (hospital["id"],))
    hospital["doctor"] = doctor
    return jsonify({"hospital": hospital, "doctor": doctor})
=======
    """Login hospital by email/password and return hospital + doctor."""
    try:
        data = request.get_json(force=True) or {}
        email = data.get("email")
        password = data.get("password", "")
>>>>>>> 3de2135c16680a6e0e788707b29d22d238c464c5

        hospital = get_one("SELECT * FROM hospitals WHERE email = ?", (email,))
        if not hospital or not check_password_hash(hospital["password_hash"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        doctor = get_one("SELECT * FROM doctors WHERE hospital_id = ?", (hospital["id"],))
        hospital["doctor"] = doctor
        return jsonify({"hospital": hospital, "doctor": doctor})
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.exception("Error in login_hospital")
        return jsonify({"error": f"Server error while logging in hospital: {exc}"}), 500

