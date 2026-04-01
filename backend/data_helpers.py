from datetime import datetime, timezone

try:
    from .db import fetch_one, table_has_column
except ImportError:
    from db import fetch_one, table_has_column


def utc_year():
    return datetime.now(timezone.utc).year


def clean_number(value):
    if value is None:
        return None
    return float(value)


def clean_int(value):
    if value is None:
        return None
    return int(float(value))


def get_table_row(table_name, columns, filters=None, preferred_year=None):
    filters = filters or {}
    where_parts = []
    params = []

    for key, value in filters.items():
        where_parts.append(f"{key} = %s")
        params.append(value)

    has_year = table_has_column(table_name, "year")

    if preferred_year is not None and has_year:
        year_parts = list(where_parts) + ["year = %s"]
        year_params = list(params) + [preferred_year]
        row = fetch_one(
            f"SELECT {columns} FROM {table_name} "
            f"{'WHERE ' + ' AND '.join(year_parts) if year_parts else ''} LIMIT 1",
            tuple(year_params),
        )
        if row:
            return row

    suffix = "ORDER BY year DESC LIMIT 1" if has_year else "LIMIT 1"
    return fetch_one(
        f"SELECT {columns} FROM {table_name} "
        f"{'WHERE ' + ' AND '.join(where_parts) if where_parts else ''} {suffix}",
        tuple(params),
    )
