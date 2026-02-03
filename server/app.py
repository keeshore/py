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
app.config["PORT"] = int(os.environ.get("PORT", "4000"))
app.config["HOST"] = os.environ.get("HOST", "0.0.0.0")

app.config["GA_MEASUREMENT_ID"] = os.environ.get("GA_MEASUREMENT_ID", "")
app.config["GTM_CONTAINER_ID"] = os.environ.get("GTM_CONTAINER_ID", "")
app.config["GOOGLE_CALENDAR_EMBED_URL"] = os.environ.get("GOOGLE_CALENDAR_EMBED_URL", "")

app.config["RECAPTCHA_SECRET"] = os.environ.get("RECAPTCHA_SECRET", "")
app.config["RECAPTCHA_SITE_KEY"] = os.environ.get("RECAPTCHA_SITE_KEY", "")


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


def verify_recaptcha(token: str | None) -> bool:
    secret = app.config.get("RECAPTCHA_SECRET") or ""
    if not secret:
        return True
    if not token:
        return False
    try:
        resp = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=10,
        )
        data = resp.json() if resp.ok else {}
        return bool(data.get("success"))
    except requests.RequestException:
        return False


def sanitize_user(user: dict | None) -> dict | None:
    if not user:
        return None
    return {k: v for k, v in user.items() if k != "password_hash"}


def sanitize_hospital(hospital: dict | None) -> dict | None:
    if not hospital:
        return None
    return {k: v for k, v in hospital.items() if k != "password_hash"}


@app.teardown_appcontext
def teardown_db(exc):
    close_db(exc)


@app.before_request
def ensure_db():
    if not getattr(app, "_db_initialized", False):
        init_db()
        app._db_initialized = True


@app.context_processor
def inject_globals():
    return {
        "ga_measurement_id": app.config.get("GA_MEASUREMENT_ID", ""),
        "gtm_container_id": app.config.get("GTM_CONTAINER_ID", ""),
        "recaptcha_site_key": app.config.get("RECAPTCHA_SITE_KEY", ""),
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
        google_calendar_embed_url=app.config.get("GOOGLE_CALENDAR_EMBED_URL", ""),
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

        if not verify_recaptcha(data.get("recaptchaToken")):
            return jsonify({"error": "reCAPTCHA verification failed"}), 400

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

        user = sanitize_user(get_one("SELECT * FROM users WHERE id = ?", (user_id,)))
        return jsonify({"user": user})
    except Exception as exc:  # pragma: no cover
        app.logger.exception("Error in register_user")
        return jsonify({"error": f"Server error while registering user: {exc}"}), 500


@app.post("/api/users/login")
def login_user():
    try:
        data = request.get_json(force=True) or {}

        if not verify_recaptcha(data.get("recaptchaToken")):
            return jsonify({"error": "reCAPTCHA verification failed"}), 400

        email = data.get("email")
        password = data.get("password", "")

        user = get_one("SELECT * FROM users WHERE email = ?", (email,))
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"user": sanitize_user(user)})
    except Exception as exc:  # pragma: no cover
        app.logger.exception("Error in login_user")
        return jsonify({"error": f"Server error while logging in: {exc}"}), 500


@app.get("/api/users/<user_id>")
def get_user(user_id: str):
    user = sanitize_user(get_one("SELECT * FROM users WHERE id = ?", (user_id,)))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user})


@app.put("/api/users/<user_id>")
def update_user(user_id: str):
    data = request.get_json(force=True) or {}
    existing = get_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not existing:
        return jsonify({"error": "User not found"}), 404

    allowed = {
        "name": "name",
        "mobile": "mobile",
        "height": "height",
        "weight": "weight",
        "dob": "dob",
        "address": "address",
        "latitude": "latitude",
        "longitude": "longitude",
    }
    updates: list[tuple[str, object]] = []
    for key, col in allowed.items():
        if key in data:
            updates.append((col, data.get(key)))
    if "dob" in data:
        updates.append(("age", calc_age(data.get("dob"))))

    if updates:
        set_clause = ", ".join([f"{col} = ?" for col, _ in updates])
        params = [val for _, val in updates] + [user_id]
        run(f"UPDATE users SET {set_clause} WHERE id = ?", params)

    user = sanitize_user(get_one("SELECT * FROM users WHERE id = ?", (user_id,)))
    return jsonify({"user": user})


@app.post("/api/hospitals/register")
def register_hospital():
    try:
        data = request.get_json(force=True) or {}

        if not verify_recaptcha(data.get("recaptchaToken")):
            return jsonify({"error": "reCAPTCHA verification failed"}), 400

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
                data.get("morningFrom") or data.get("morning_from"),
                data.get("morningTo") or data.get("morning_to"),
                data.get("eveningFrom") or data.get("evening_from"),
                data.get("eveningTo") or data.get("evening_to"),
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

        hospital = sanitize_hospital(get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,)))
        doctor = get_one("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
        if hospital is not None:
            hospital["doctor"] = doctor
        return jsonify({"hospital": hospital, "doctor": doctor})
    except Exception as exc:  # pragma: no cover
        app.logger.exception("Error in register_hospital")
        return jsonify({"error": f"Server error while registering hospital: {exc}"}), 500


@app.post("/api/hospitals/login")
def login_hospital():
    try:
        data = request.get_json(force=True) or {}

        if not verify_recaptcha(data.get("recaptchaToken")):
            return jsonify({"error": "reCAPTCHA verification failed"}), 400

        email = data.get("email")
        password = data.get("password", "")

        hospital = get_one("SELECT * FROM hospitals WHERE email = ?", (email,))
        if not hospital or not check_password_hash(hospital["password_hash"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        doctor = get_one("SELECT * FROM doctors WHERE hospital_id = ?", (hospital["id"],))
        hospital_out = sanitize_hospital(hospital)
        if hospital_out is not None:
            hospital_out["doctor"] = doctor
        return jsonify({"hospital": hospital_out, "doctor": doctor})
    except Exception as exc:  # pragma: no cover
        app.logger.exception("Error in login_hospital")
        return jsonify({"error": f"Server error while logging in hospital: {exc}"}), 500


@app.get("/api/hospitals/<hospital_id>")
def get_hospital(hospital_id: str):
    hospital = sanitize_hospital(get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,)))
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    doctor = get_one("SELECT * FROM doctors WHERE hospital_id = ?", (hospital_id,))
    hospital["doctor"] = doctor
    return jsonify({"hospital": hospital, "doctor": doctor})


@app.put("/api/hospitals/<hospital_id>")
def update_hospital(hospital_id: str):
    data = request.get_json(force=True) or {}
    existing = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    if not existing:
        return jsonify({"error": "Hospital not found"}), 404

    allowed = {
        "name": "name",
        "address": "address",
        "latitude": "latitude",
        "longitude": "longitude",
        "emergency": "emergency",
        "morning_from": "morning_from",
        "morning_to": "morning_to",
        "evening_from": "evening_from",
        "evening_to": "evening_to",
    }
    updates: list[tuple[str, object]] = []
    for key, col in allowed.items():
        if key in data:
            val = data.get(key)
            if col == "emergency":
                val = 1 if bool(val) else 0
            updates.append((col, val))

    if updates:
        set_clause = ", ".join([f"{col} = ?" for col, _ in updates])
        params = [val for _, val in updates] + [hospital_id]
        run(f"UPDATE hospitals SET {set_clause} WHERE id = ?", params)

    hospital = sanitize_hospital(get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,)))
    doctor = get_one("SELECT * FROM doctors WHERE hospital_id = ?", (hospital_id,))
    if hospital is not None:
        hospital["doctor"] = doctor
    return jsonify({"hospital": hospital, "doctor": doctor})


@app.put("/api/doctors/<doctor_id>")
def update_doctor(doctor_id: str):
    data = request.get_json(force=True) or {}
    existing = get_one("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
    if not existing:
        return jsonify({"error": "Doctor not found"}), 404

    allowed = {
        "name": "name",
        "qualification": "qualification",
        "specialization": "specialization",
        "description": "description",
        "latitude": "latitude",
        "longitude": "longitude",
    }
    updates: list[tuple[str, object]] = []
    for key, col in allowed.items():
        if key in data:
            updates.append((col, data.get(key)))

    if updates:
        set_clause = ", ".join([f"{col} = ?" for col, _ in updates])
        params = [val for _, val in updates] + [doctor_id]
        run(f"UPDATE doctors SET {set_clause} WHERE id = ?", params)

    doctor = get_one("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
    return jsonify({"doctor": doctor})


@app.get("/api/doctors/search")
def search_doctors():
    specialization = (request.args.get("specialization") or "").strip()
    user_lat = request.args.get("userLat")
    user_lng = request.args.get("userLng")

    where = []
    params: list[object] = []
    if specialization:
        where.append("(d.specialization = ? OR d.specialization LIKE ?)")
        params.extend([specialization, f"%{specialization}%"])
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    doctors = get_all(
        f"""
        SELECT
          d.*, h.name AS hospital_name, h.address AS hospital_address,
          h.latitude AS hospital_latitude, h.longitude AS hospital_longitude
        FROM doctors d
        JOIN hospitals h ON h.id = d.hospital_id
        {where_sql}
        """,
        params,
    )

    if user_lat and user_lng:
        try:
            lat = float(user_lat)
            lng = float(user_lng)
            for doc in doctors:
                hlat = doc.get("hospital_latitude")
                hlng = doc.get("hospital_longitude")
                if hlat is None or hlng is None:
                    doc["distance_km"] = None
                else:
                    doc["distance_km"] = haversine_km(lat, lng, float(hlat), float(hlng))
            doctors.sort(key=lambda d: (d.get("distance_km") is None, d.get("distance_km") or 0))
        except ValueError:
            pass

    return jsonify({"doctors": doctors})


@app.post("/api/appointments")
def create_appointment():
    data = request.get_json(force=True) or {}
    required = ["userId", "hospitalId", "doctorId"]
    if any(not data.get(k) for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    appt_id = str(uuid.uuid4())
    run(
        """
        INSERT INTO appointments (id, user_id, hospital_id, doctor_id, problem, status, preferred_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            appt_id,
            data.get("userId"),
            data.get("hospitalId"),
            data.get("doctorId"),
            data.get("problem"),
            "Booked",
            data.get("preferredTime"),
        ),
    )
    appt = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    return jsonify({"appointment": appt})


def _list_appointments(where_sql: str = "", params: list[object] | None = None) -> list[dict]:
    params = params or []
    return get_all(
        f"""
        SELECT
          a.*,
          a.problem AS reason,
          u.name AS user_name,
          u.email AS user_email,
          u.mobile AS user_mobile
        FROM appointments a
        LEFT JOIN users u ON u.id = a.user_id
        {where_sql}
        ORDER BY a.created_at DESC
        """,
        params,
    )


@app.get("/api/appointments")
def list_appointments():
    user_id = request.args.get("userId")
    doctor_id = request.args.get("doctorId")
    hospital_id = request.args.get("hospitalId")

    where = []
    params: list[object] = []
    if user_id:
        where.append("a.user_id = ?")
        params.append(user_id)
    if doctor_id:
        where.append("a.doctor_id = ?")
        params.append(doctor_id)
    if hospital_id:
        where.append("a.hospital_id = ?")
        params.append(hospital_id)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    appointments = _list_appointments(where_sql, params)
    return jsonify({"appointments": appointments})


@app.get("/api/appointments/today")
def list_today_appointments():
    doctor_id = request.args.get("doctorId")
    hospital_id = request.args.get("hospitalId")

    where = ["date(a.created_at) = date('now')"]
    params: list[object] = []
    if doctor_id:
        where.append("a.doctor_id = ?")
        params.append(doctor_id)
    if hospital_id:
        where.append("a.hospital_id = ?")
        params.append(hospital_id)
    where_sql = "WHERE " + " AND ".join(where)

    appointments = _list_appointments(where_sql, params)
    return jsonify({"appointments": appointments})


def _set_appointment_status(appt_id: str, status: str):
    existing = get_one("SELECT id FROM appointments WHERE id = ?", (appt_id,))
    if not existing:
        return None
    run("UPDATE appointments SET status = ? WHERE id = ?", (status, appt_id))
    return get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))


@app.put("/api/appointments/<appt_id>/cancel")
def cancel_appointment(appt_id: str):
    appt = _set_appointment_status(appt_id, "Cancelled")
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({"appointment": appt})


@app.put("/api/appointments/<appt_id>/get-in")
def get_in_appointment(appt_id: str):
    appt = _set_appointment_status(appt_id, "In Consultation")
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({"appointment": appt})


@app.put("/api/appointments/<appt_id>/complete")
def complete_appointment(appt_id: str):
    appt = _set_appointment_status(appt_id, "Completed")
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({"appointment": appt})


@app.post("/api/firstaid")
def first_aid():
    data = request.get_json(force=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    response = call_gemini(
        "You are a first-aid assistant. Provide safe, general advice, include urgent warning signs, and recommend seeking professional care when appropriate.\n\n"
        + prompt
    )

    chat_id = str(uuid.uuid4())
    run(
        "INSERT INTO firstaid_chats (id, user_id, prompt, response) VALUES (?, ?, ?, ?)",
        (chat_id, data.get("userId"), prompt, response),
    )
    return jsonify({"response": response, "id": chat_id})


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
    app.run(host=app.config["HOST"], port=app.config["PORT"], debug=debug)

