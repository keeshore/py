import os
import sqlite3
from typing import Any, Dict, Iterable, List, Optional
from flask import g

DB_PATH = os.environ.get("DB_PATH") or os.path.join(os.path.dirname(__file__), "data.db")


def get_db() -> sqlite3.Connection:
    db = getattr(g, "_db", None)
    if db is None:
        db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON;")
        g._db = db
    return db


def close_db(_exc: Optional[BaseException] = None) -> None:
    db = g.pop("_db", None)
    if db is not None:
        db.close()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()} if row else {}


def init_db() -> None:
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
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
        );

        CREATE TABLE IF NOT EXISTS hospitals (
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
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            hospital_id TEXT NOT NULL,
            problem TEXT,
            status TEXT DEFAULT 'Booked',
            preferred_time TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS firstaid_chats (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            prompt TEXT,
            response TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """
    )
    db.commit()


def run(sql: str, params: Iterable[Any] = ()) -> None:
    db = get_db()
    db.execute(sql, tuple(params))
    db.commit()


def get_one(sql: str, params: Iterable[Any] = ()) -> Optional[Dict[str, Any]]:
    db = get_db()
    cur = db.execute(sql, tuple(params))
    row = cur.fetchone()
    return row_to_dict(row) if row else None


def get_all(sql: str, params: Iterable[Any] = ()) -> List[Dict[str, Any]]:
    db = get_db()
    cur = db.execute(sql, tuple(params))
    rows = cur.fetchall()
    return [row_to_dict(r) for r in rows]
