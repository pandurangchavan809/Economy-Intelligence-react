import os

from dotenv import load_dotenv


load_dotenv()


def _as_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _normalize_origin(value):
    if value is None:
        return None

    normalized = str(value).strip().rstrip("/")
    return normalized or None


def _split_csv(value):
    if not value:
        return []

    return [item for item in (_normalize_origin(part) for part in value.split(",")) if item]


def _unique(values):
    seen = set()
    items = []

    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        items.append(value)

    return items


class Config:
    DEBUG = _as_bool(os.getenv("FLASK_DEBUG"), default=True)
    HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT") or os.getenv("FLASK_PORT", "5000"))

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "economy_intelligence")
    DB_SSL_DISABLED = _as_bool(os.getenv("DB_SSL_DISABLED"), default=False)

    FRONTEND_ORIGIN = _normalize_origin(os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"))
    FRONTEND_ORIGINS = _unique(
        [
            *_split_csv(os.getenv("FRONTEND_ORIGINS")),
            FRONTEND_ORIGIN,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://economic-intelligence.vercel.app",
        ]
    )

    ADMIN_ID = os.getenv("ADMIN_ID", "admin")
    ADMIN_PASS = os.getenv("ADMIN_PASS", "admin123")
    JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "12"))

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
