import re
from functools import lru_cache
from threading import Lock

import mysql.connector
from mysql.connector import pooling

try:
    from .config import Config
except ImportError:
    from config import Config


IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
_POOL_LOCK = Lock()
_CONNECTION_POOL = None


def _get_connection_kwargs():
    return {
        "host": Config.DB_HOST,
        "port": Config.DB_PORT,
        "user": Config.DB_USER,
        "password": Config.DB_PASSWORD,
        "database": Config.DB_NAME,
        "ssl_disabled": Config.DB_SSL_DISABLED,
        "connection_timeout": Config.DB_CONNECTION_TIMEOUT,
    }


def _get_connection_pool():
    global _CONNECTION_POOL

    if _CONNECTION_POOL is None:
        with _POOL_LOCK:
            if _CONNECTION_POOL is None:
                _CONNECTION_POOL = pooling.MySQLConnectionPool(
                    pool_name=Config.DB_POOL_NAME,
                    pool_size=Config.DB_POOL_SIZE,
                    pool_reset_session=True,
                    **_get_connection_kwargs(),
                )

    return _CONNECTION_POOL


def get_connection():
    try:
        return _get_connection_pool().get_connection()
    except Exception:
        return mysql.connector.connect(**_get_connection_kwargs())


def fetch_one(query, params=None):
    rows = fetch_all(query, params=params)
    return rows[0] if rows else None


def fetch_all(query, params=None):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute(query, params or ())
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def execute_query(query, params=None):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute(query, params or ())

        if cursor.with_rows:
            rows = cursor.fetchall()
            return {
                "type": "rows",
                "columns": list(cursor.column_names),
                "rows": rows,
            }

        connection.commit()
        return {
            "type": "write",
            "rows_affected": cursor.rowcount,
        }
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def is_safe_identifier(name):
    return bool(name and IDENTIFIER_PATTERN.match(name))


@lru_cache(maxsize=256)
def table_has_column(table_name, column_name):
    query = """
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s
    """
    row = fetch_one(query, (Config.DB_NAME, table_name, column_name))
    return bool(row and row["total"])
