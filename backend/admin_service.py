try:
    from .db import execute_query, fetch_all, fetch_one, is_safe_identifier, table_has_column
except ImportError:
    from db import execute_query, fetch_all, fetch_one, is_safe_identifier, table_has_column


def get_admin_summary():
    country_row = fetch_one("SELECT COUNT(*) AS total FROM countries")
    table_rows = fetch_all("SHOW FULL TABLES")
    table_names = [list(row.values())[0] for row in table_rows]

    return {
        "countries": int(country_row["total"]) if country_row else 0,
        "tables": len(table_names),
        "latestTables": table_names[:12],
    }


def get_admin_tables():
    rows = fetch_all("SHOW FULL TABLES")
    return [list(row.values())[0] for row in rows]


def get_admin_table_data(table_name, country_id=None):
    if not is_safe_identifier(table_name):
        raise ValueError("Invalid table name")

    query = f"SELECT * FROM {table_name}"
    params = []

    if country_id and table_has_column(table_name, "country_id"):
        query += " WHERE country_id = %s"
        params.append(country_id)

    if table_has_column(table_name, "year"):
        query += " ORDER BY year DESC"

    query += " LIMIT 100"
    rows = fetch_all(query, tuple(params))

    return {
        "table": table_name,
        "columns": list(rows[0].keys()) if rows else [],
        "rows": rows,
    }


def run_admin_query(query):
    return execute_query(query)
