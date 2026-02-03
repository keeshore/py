"""Cross-platform production entrypoint (Windows-friendly).

Use this if your host doesn't support gunicorn (e.g., Windows).
Linux hosts should prefer gunicorn with `server/wsgi.py`.
"""

import os

from waitress import serve

from app import app


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "4000"))
    serve(app, host=host, port=port)
