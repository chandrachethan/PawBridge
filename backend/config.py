"""Paths and settings shared by the whole backend."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

# Railway mounts persistent storage at the path configured in its Volume settings.
# Locally, keep the original database folder and frontend/uploads folder.
APP_ENV = os.getenv("APP_ENV", "development").lower()
DATA_DIR = Path(os.getenv("PAWBRIDGE_DATA_DIR", str(ROOT_DIR / "database")))
DATABASE_DIR = DATA_DIR  # retained for show_db.py and local tooling
if APP_ENV == "production":
    UPLOAD_DIR = Path(os.getenv("PAWBRIDGE_UPLOAD_DIR", str(DATA_DIR / "uploads")))
else:
    UPLOAD_DIR = Path(os.getenv("PAWBRIDGE_UPLOAD_DIR", str(FRONTEND_DIR / "uploads")))

DATABASE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("PAWBRIDGE_DATABASE_URL") or ("sqlite:///" + str(DATABASE_DIR / "pawbridge.db"))

if APP_ENV == "production":
    SECRET_KEY = os.getenv("PAWBRIDGE_SECRET")
    if not SECRET_KEY or len(SECRET_KEY) < 32:
        raise RuntimeError("Set PAWBRIDGE_SECRET to a random value of at least 32 characters in production.")
else:
    SECRET_KEY = os.getenv("PAWBRIDGE_SECRET", "local-development-only-change-before-deploy")

TOKEN_MINUTES = 60 * 24 * 7

VISIT_SLOTS = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "5:00 PM"]
FREE_DELIVERY_ABOVE = 499
DELIVERY_FEE = 49
