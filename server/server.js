require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { run, get, all, getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcAge = dob => {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, mobile, password, height, weight, dob, address, latitude, longitude } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    const exists = await get('SELECT id FROM users WHERE email = ?', { [1]: email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const id = uuid();
    const password_hash = await bcrypt.hash(password, 10);
    const age = calcAge(dob);
    await run(`INSERT INTO users (id, name, email, mobile, password_hash, height, weight, dob, age, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    { [1]: id, [2]: name, [3]: email, [4]: mobile, [5]: password_hash, [6]: height, [7]: weight, [8]: dob, [9]: age, [10]: address, [11]: latitude, [12]: longitude });
    const user = await get('SELECT * FROM users WHERE id = ?', { [1]: id });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'User registration failed', detail: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = ?', { [1]: email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', { [1]: req.params.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', { [1]: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const fields = ['name', 'email', 'mobile', 'height', 'weight', 'dob', 'address', 'latitude', 'longitude'];
    const updates = { ...user };
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    updates.age = calcAge(updates.dob);
    await run(`UPDATE users SET name=?, email=?, mobile=?, height=?, weight=?, dob=?, age=?, address=?, latitude=?, longitude=? WHERE id=?`,
      { [1]: updates.name, [2]: updates.email, [3]: updates.mobile, [4]: updates.height, [5]: updates.weight, [6]: updates.dob, [7]: updates.age, [8]: updates.address, [9]: updates.latitude, [10]: updates.longitude, [11]: req.params.id });
    const fresh = await get('SELECT * FROM users WHERE id = ?', { [1]: req.params.id });
    res.json({ user: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

app.post('/api/hospitals/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      doctorName,
      doctorQualification,
      doctorSpecialization,
      doctorDescription,
      emergency,
      morningFrom,
      morningTo,
      eveningFrom,
      eveningTo,
      address,
      latitude,
      longitude
    } = req.body;
    if (!name || !email || !password || !doctorName) return res.status(400).json({ error: 'Missing required fields' });
    const exists = await get('SELECT id FROM hospitals WHERE email = $email', { $email: email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hospitalId = uuid();
    const doctorId = uuid();
    const password_hash = await bcrypt.hash(password, 10);
    await run(`INSERT INTO hospitals (id, name, email, password_hash, emergency, morning_from, morning_to, evening_from, evening_to, address, latitude, longitude)
      VALUES ($id, $name, $email, $password_hash, $emergency, $morning_from, $morning_to, $evening_from, $evening_to, $address, $latitude, $longitude)`,
      {
        $id: hospitalId,
        $name: name,
        $email: email,
        $password_hash: password_hash,
        $emergency: emergency ? 1 : 0,
        $morning_from: morningFrom,
        $morning_to: morningTo,
        $evening_from: eveningFrom,
        $evening_to: eveningTo,
        $address: address,
        $latitude: latitude,
        $longitude: longitude
      });
    await run(`INSERT INTO doctors (id, hospital_id, name, qualification, specialization, description, latitude, longitude)
      VALUES ($id, $hospital_id, $name, $qualification, $specialization, $description, $latitude, $longitude)`,
      {
        $id: doctorId,
        $hospital_id: hospitalId,
        $name: doctorName,
        $qualification: doctorQualification,
        $specialization: doctorSpecialization,
        $description: doctorDescription,
        $latitude: latitude,
        $longitude: longitude
      });
    const hospital = await get('SELECT * FROM hospitals WHERE id = $id', { $id: hospitalId });
    const doctor = await get('SELECT * FROM doctors WHERE id = $id', { $id: doctorId });
    res.json({ hospital, doctor });
  } catch (err) {
    res.status(500).json({ error: 'Hospital registration failed', detail: err.message });
  }
});

app.post('/api/hospitals/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hospital = await get('SELECT * FROM hospitals WHERE email = $email', { $email: email });
    if (!hospital) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, hospital.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const doctor = await get('SELECT * FROM doctors WHERE hospital_id = $id', { $id: hospital.id });
    res.json({ hospital, doctor });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

app.get('/api/hospitals/:id', async (req, res) => {
  const hospital = await get('SELECT * FROM hospitals WHERE id = $id', { $id: req.params.id });
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  const doctor = await get('SELECT * FROM doctors WHERE hospital_id = $id', { $id: req.params.id });
  res.json({ hospital, doctor });
});

app.put('/api/hospitals/:id', async (req, res) => {
  try {
    const hospital = await get('SELECT * FROM hospitals WHERE id = $id', { $id: req.params.id });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    const updates = { ...hospital };
    const fields = ['name', 'email', 'emergency', 'morning_from', 'morning_to', 'evening_from', 'evening_to', 'address', 'latitude', 'longitude'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    await run(`UPDATE hospitals SET name=$name, email=$email, emergency=$emergency, morning_from=$morning_from, morning_to=$morning_to, evening_from=$evening_from, evening_to=$evening_to, address=$address, latitude=$latitude, longitude=$longitude WHERE id=$id`,
      { ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`$${k}`, k === 'emergency' ? (v ? 1 : 0) : v])), $id: req.params.id });
    const doctor = await get('SELECT * FROM doctors WHERE hospital_id = $id', { $id: req.params.id });
    const fresh = await get('SELECT * FROM hospitals WHERE id = $id', { $id: req.params.id });
    res.json({ hospital: fresh, doctor });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await get('SELECT * FROM doctors WHERE id = $id', { $id: req.params.id });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    const updates = { ...doctor };
    const fields = ['name', 'qualification', 'specialization', 'description', 'latitude', 'longitude'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    await run(`UPDATE doctors SET name=$name, qualification=$qualification, specialization=$specialization, description=$description, latitude=$latitude, longitude=$longitude WHERE id=$id`,
      { ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`$${k}`, v])), $id: req.params.id });
    const fresh = await get('SELECT * FROM doctors WHERE id = $id', { $id: req.params.id });
    res.json({ doctor: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Doctor update failed', detail: err.message });
  }
});

app.get('/api/doctors/search', async (req, res) => {
  const { specialization, userLat, userLng } = req.query;
  let doctors = await all('SELECT d.*, h.name AS hospital_name, h.address AS hospital_address, h.latitude AS hospital_latitude, h.longitude AS hospital_longitude FROM doctors d JOIN hospitals h ON d.hospital_id = h.id');
  if (specialization) doctors = doctors.filter(d => (d.specialization || '').toLowerCase().includes(specialization.toLowerCase()));
  if (userLat && userLng) {
    doctors = doctors.map(d => {
      const lat = d.latitude ?? d.hospital_latitude;
      const lng = d.longitude ?? d.hospital_longitude;
      const distance_km = haversineKm(Number(userLat), Number(userLng), Number(lat), Number(lng));
      return { ...d, distance_km };
    }).sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }
  res.json({ doctors });
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { userId, hospitalId, doctorId, problem, preferredTime } = req.body;
    if (!userId || !hospitalId || !doctorId) return res.status(400).json({ error: 'Missing ids' });
    const id = uuid();
    await run(`INSERT INTO appointments (id, user_id, hospital_id, doctor_id, problem, status, preferred_time)
      VALUES ($id, $user_id, $hospital_id, $doctor_id, $problem, 'Booked', $preferred_time)`, {
      $id: id,
      $user_id: userId,
      $hospital_id: hospitalId,
      $doctor_id: doctorId,
      $problem: problem,
      $preferred_time: preferredTime
    });
    const appt = await get('SELECT * FROM appointments WHERE id = $id', { $id: id });
    res.json({ appointment: appt });
  } catch (err) {
    res.status(500).json({ error: 'Booking failed', detail: err.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  const { userId, hospitalId, doctorId } = req.query;
  let query = `SELECT a.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile
    FROM appointments a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1`;
  const params = {};
  if (userId) { query += ' AND a.user_id = $user'; params.$user = userId; }
  if (hospitalId) { query += ' AND a.hospital_id = $hospital'; params.$hospital = hospitalId; }
  if (doctorId) { query += ' AND a.doctor_id = $doctor'; params.$doctor = doctorId; }
  const list = await all(query, params);
  res.json({ appointments: list });
});

app.get('/api/appointments/today', async (req, res) => {
  const { hospitalId, doctorId } = req.query;
  let query = `SELECT a.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile
    FROM appointments a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE date(a.created_at) = date('now','localtime')`;
  const params = {};
  if (hospitalId) { query += ' AND a.hospital_id = $hospital'; params.$hospital = hospitalId; }
  if (doctorId) { query += ' AND a.doctor_id = $doctor'; params.$doctor = doctorId; }
  const list = await all(query, params);
  res.json({ appointments: list });
});

app.put('/api/appointments/:id/cancel', async (req, res) => {
  try {
    const appt = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    await run('UPDATE appointments SET status = "Cancelled" WHERE id = $id', { $id: req.params.id });
    const fresh = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    res.json({ appointment: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Cancel failed', detail: err.message });
  }
});

app.put('/api/appointments/:id/get-in', async (req, res) => {
  try {
    const appt = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    await run('UPDATE appointments SET status = "In Consultation" WHERE id = $id', { $id: req.params.id });
    const fresh = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    res.json({ appointment: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Get-in failed', detail: err.message });
  }
});

app.put('/api/appointments/:id/complete', async (req, res) => {
  try {
    const appt = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    await run('UPDATE appointments SET status = "Completed" WHERE id = $id', { $id: req.params.id });
    const fresh = await get('SELECT * FROM appointments WHERE id = $id', { $id: req.params.id });
    res.json({ appointment: fresh });
  } catch (err) {
    res.status(500).json({ error: 'Complete failed', detail: err.message });
  }
});

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return 'Gemini API key missing.';
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }]}] })
    });
    const data = await resp.json();
    if (!resp.ok) {
      const detail = data?.error?.message || 'Gemini API error';
      return `Gemini API error: ${detail}`;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || 'No response received from Gemini.';
  } catch (err) {
    return `Gemini request failed: ${err.message}`;
  }
}

app.post('/api/firstaid', async (req, res) => {
  try {
    const { userId, prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    const response = await callGemini(prompt);
    const id = uuid();
    await run('INSERT INTO firstaid_chats (id, user_id, prompt, response) VALUES (?, ?, ?, ?)', { [1]: id, [2]: userId || null, [3]: prompt, [4]: response });
    res.json({ id, prompt, response });
  } catch (err) {
    res.status(500).json({ error: 'First aid failed', detail: err.message });
  }
});

getDb().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`✅ API server running on http://localhost:${PORT}`);
  });
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 120000;
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
