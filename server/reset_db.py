"""Reset the local SQLite database.

Usage (Windows PowerShell):
    cd server
    .\\.venv\\Scripts\\python reset_db.py

Notes:
- Stop the running server before resetting to avoid file-lock issues on Windows.
- Respects `DB_PATH` env var; default is `server/data.db`.
"""

import os

from app import app
from db import DB_PATH, init_db


def main() -> None:
    path = os.environ.get("DB_PATH") or DB_PATH

    if os.path.exists(path):
        try:
            os.remove(path)
            print(f"Deleted existing DB: {path}")
        except PermissionError as exc:
            raise SystemExit(
                f"Could not delete DB (file may be in use). Stop the server and try again.\n\n{exc}"
            )
    else:
        print(f"No existing DB found at: {path}")

    # Recreate schema (init_db uses flask.g, so it must run under app context)
    with app.app_context():
        init_db()
    print(f"Created fresh DB + schema at: {path}")


if __name__ == "__main__":
    main()
