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


def verify_recaptcha(token: str | None) -> bool:
    secret = os.environ.get("RECAPTCHA_SECRET")
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
        data = resp.json()
        return bool(data.get("success"))
    except requests.RequestException:
        return False


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
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        )
        return text or "No response received from Gemini."
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


@app.route("/")
def landing_page():
    return render_template(
        "landing.html",
        page="landing",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/register")
def user_register_page():
    return render_template(
        "user_register.html",
        page="user-register",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/login")
@app.route("/users/login")
def user_login_page():
    return render_template(
        "user_login.html",
        page="user-login",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/dashboard")
def user_dashboard_page():
    return render_template(
        "user_dashboard.html",
        page="user-dashboard",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/book")
def user_book_page():
    return render_template(
        "book.html",
        page="book",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/rebook")
def user_rebook_page():
    return render_template(
        "rebook.html",
        page="rebook",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/firstaid")
def user_firstaid_page():
    return render_template(
        "firstaid.html",
        page="firstaid",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/user/qr")
def user_qr_page():
    return render_template(
        "qr.html",
        page="qr",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/hospital/register")
def hospital_register_page():
    return render_template(
        "hospital_register.html",
        page="hospital-register",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/hospital/login")
def hospital_login_page():
    return render_template(
        "hospital_login.html",
        page="hospital-login",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/hospital/dashboard")
def hospital_dashboard_page():
    return render_template(
        "hospital_dashboard.html",
        page="hospital-dashboard",
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.route("/hospital/<hospital_id>")
def hospital_public_page(hospital_id: str):
    return render_template(
        "hospital_view.html",
        page="hospital-view",
        hospital_id=hospital_id,
        api_base=app.config["API_BASE"],
        recaptcha_site_key=app.config["RECAPTCHA_SITE_KEY"],
    )


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "timestamp": datetime.utcnow().isoformat()})


@app.post("/api/users/register")
def register_user():
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


@app.post("/api/users/login")
def login_user():
    data = request.get_json(force=True) or {}
    user = get_one("SELECT * FROM users WHERE email = ?", (data.get("email"),))
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    if not check_password_hash(user["password_hash"], data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"user": user})


@app.get("/api/users/<user_id>")
def get_user(user_id: str):
    user = get_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user})


@app.put("/api/users/<user_id>")
def update_user(user_id: str):
    data = request.get_json(force=True) or {}
    user = get_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        return jsonify({"error": "User not found"}), 404
    updates = {**user}
    fields = [
        "name",
        "email",
        "mobile",
        "height",
        "weight",
        "dob",
        "address",
        "latitude",
        "longitude",
    ]
    for f in fields:
        if f in data:
            updates[f] = data[f]
    updates["age"] = calc_age(updates.get("dob"))
    run(
        """
        UPDATE users SET name=?, email=?, mobile=?, height=?, weight=?, dob=?, age=?, address=?, latitude=?, longitude=? WHERE id=?
        """,
        (
            updates.get("name"),
            updates.get("email"),
            updates.get("mobile"),
            updates.get("height"),
            updates.get("weight"),
            updates.get("dob"),
            updates.get("age"),
            updates.get("address"),
            updates.get("latitude"),
            updates.get("longitude"),
            user_id,
        ),
    )
    fresh = get_one("SELECT * FROM users WHERE id = ?", (user_id,))
    return jsonify({"user": fresh})


@app.post("/api/hospitals/register")
def register_hospital():
    data = request.get_json(force=True) or {}
    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing required fields"}), 400
    exists = get_one("SELECT id FROM hospitals WHERE email = ?", (data.get("email"),))
    if exists:
        return jsonify({"error": "Email already registered"}), 400
    hospital_id = str(uuid.uuid4())
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
    hospital = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    return jsonify({"hospital": hospital})


@app.post("/api/hospitals/login")
def login_hospital():
    data = request.get_json(force=True) or {}
    hospital = get_one("SELECT * FROM hospitals WHERE email = ?", (data.get("email"),))
    if not hospital:
        return jsonify({"error": "Invalid credentials"}), 401
    if not check_password_hash(hospital["password_hash"], data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"hospital": hospital})


@app.get("/api/hospitals/<hospital_id>")
def get_hospital(hospital_id: str):
    hospital = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    return jsonify({"hospital": hospital})


@app.put("/api/hospitals/<hospital_id>")
def update_hospital(hospital_id: str):
    data = request.get_json(force=True) or {}
    hospital = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    updates = {**hospital}
    fields = [
        "name",
        "email",
        "emergency",
        "morning_from",
        "morning_to",
        "evening_from",
        "evening_to",
        "address",
        "latitude",
        "longitude",
    ]
    for f in fields:
        if f in data:
            updates[f] = data[f]
    run(
        """
        UPDATE hospitals SET name=?, email=?, emergency=?, morning_from=?, morning_to=?, evening_from=?, evening_to=?, address=?, latitude=?, longitude=? WHERE id=?
        """,
        (
            updates.get("name"),
            updates.get("email"),
            1 if updates.get("emergency") else 0,
            updates.get("morning_from"),
            updates.get("morning_to"),
            updates.get("evening_from"),
            updates.get("evening_to"),
            updates.get("address"),
            updates.get("latitude"),
            updates.get("longitude"),
            hospital_id,
        ),
    )
    fresh = get_one("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    return jsonify({"hospital": fresh})


@app.post("/api/appointments")
def create_appointment():
    data = request.get_json(force=True) or {}
    if not data.get("userId") or not data.get("hospitalId"):
        return jsonify({"error": "Missing ids"}), 400
    appt_id = str(uuid.uuid4())
    run(
        """
        INSERT INTO appointments (id, user_id, hospital_id, problem, status, preferred_time)
        VALUES (?, ?, ?, ?, 'Booked', ?)
        """,
        (
            appt_id,
            data.get("userId"),
            data.get("hospitalId"),
            data.get("problem"),
            data.get("preferredTime"),
        ),
    )
    appt = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    return jsonify({"appointment": appt})


@app.get("/api/appointments")
def list_appointments():
    user_id = request.args.get("userId")
    hospital_id = request.args.get("hospitalId")
    query = [
        "SELECT a.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile",
        "FROM appointments a",
        "LEFT JOIN users u ON a.user_id = u.id",
        "WHERE 1=1",
    ]
    params: list[str] = []
    if user_id:
        query.append("AND a.user_id = ?")
        params.append(user_id)
    if hospital_id:
        query.append("AND a.hospital_id = ?")
        params.append(hospital_id)
    rows = get_all("\n".join(query), params)
    return jsonify({"appointments": rows})


@app.get("/api/appointments/today")
def list_today_appointments():
    hospital_id = request.args.get("hospitalId")
    query = [
        "SELECT a.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile",
        "FROM appointments a",
        "LEFT JOIN users u ON a.user_id = u.id",
        "WHERE date(a.created_at) = date('now','localtime')",
    ]
    params: list[str] = []
    if hospital_id:
        query.append("AND a.hospital_id = ?")
        params.append(hospital_id)
    rows = get_all("\n".join(query), params)
    return jsonify({"appointments": rows})


@app.put("/api/appointments/<appt_id>/cancel")
def cancel_appointment(appt_id: str):
    appt = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    run("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", (appt_id,))
    fresh = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    return jsonify({"appointment": fresh})


@app.put("/api/appointments/<appt_id>/get-in")
def get_in_appointment(appt_id: str):
    appt = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    run("UPDATE appointments SET status = 'In Consultation' WHERE id = ?", (appt_id,))
    fresh = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    return jsonify({"appointment": fresh})


@app.put("/api/appointments/<appt_id>/complete")
def complete_appointment(appt_id: str):
    appt = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    run("UPDATE appointments SET status = 'Completed' WHERE id = ?", (appt_id,))
    fresh = get_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    return jsonify({"appointment": fresh})


@app.post("/api/firstaid")
def first_aid():
    data = request.get_json(force=True) or {}
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400
    response = call_gemini(prompt)
    chat_id = str(uuid.uuid4())
    run(
        "INSERT INTO firstaid_chats (id, user_id, prompt, response) VALUES (?, ?, ?, ?)",
        (chat_id, data.get("userId"), prompt, response),
    )
    return jsonify({"id": chat_id, "prompt": prompt, "response": response})


def create_app():
    with app.app_context():
        init_db()
        app._db_initialized = True
    return app


def main():
    port = int(os.environ.get("PORT", "4000"))
    create_app()
    app.run(host="0.0.0.0", port=port, debug=bool(os.environ.get("FLASK_DEBUG")))


if __name__ == "__main__":
    main()
