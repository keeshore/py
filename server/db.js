const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = process.env.DB_PATH || (process.env.RENDER ? '/var/data/data.db' : path.join(__dirname, 'data.db'));

let dbPromise = null;

function persist(db) {
  const data = db.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function bootstrap() {
  const SQL = await initSqlJs();
  const db = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    password_hash TEXT NOT NULL,
    height REAL,
    weight REAL,
    dob TEXT,
    age INTEGER,
    address TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    emergency INTEGER DEFAULT 0,
    morning_from TEXT,
    morning_to TEXT,
    evening_from TEXT,
    evening_to TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL,
    name TEXT NOT NULL,
    qualification TEXT,
    specialization TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    hospital_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    problem TEXT,
    status TEXT DEFAULT 'Booked',
    preferred_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS firstaid_chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT,
    response TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  persist(db);
  return db;
}

function getDb() {
  if (!dbPromise) dbPromise = bootstrap();
  return dbPromise;
}

async function run(sql, params = {}) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  const paramArray = Object.keys(params).length > 0 ? Object.values(params) : [];
  stmt.run(paramArray);
  stmt.free();
  persist(db);
}

async function get(sql, params = {}) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  const paramArray = Object.keys(params).length > 0 ? Object.values(params) : [];
  stmt.bind(paramArray);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

async function all(sql, params = {}) {
  const db = await getDb();
  const stmt = db.prepare(sql);
  const paramArray = Object.keys(params).length > 0 ? Object.values(params) : [];
  stmt.bind(paramArray);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

module.exports = { run, get, all, getDb };
