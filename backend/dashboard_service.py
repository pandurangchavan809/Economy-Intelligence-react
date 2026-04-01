try:
    from .data_helpers import clean_int, clean_number, get_table_row, utc_year
    from .db import fetch_all, fetch_one, table_has_column
    from .live_math import live_nominal_value, live_population_value
except ImportError:
    from data_helpers import clean_int, clean_number, get_table_row, utc_year
    from db import fetch_all, fetch_one, table_has_column
    from live_math import live_nominal_value, live_population_value


def _map_rows(rows, key="continent_code"):
    return {row[key]: row for row in rows if row.get(key) is not None}


def _fetch_latest_continent_rows(table_name, value_columns):
    columns = list(value_columns)
    has_year = table_has_column(table_name, "year")

    if has_year:
        selected_columns = ", ".join(
            [f"t.continent_code"] + [f"t.{column}" for column in columns] + ["t.year"]
        )
        return fetch_all(
            f"""
            SELECT {selected_columns}
            FROM {table_name} t
            JOIN (
                SELECT continent_code, MAX(year) AS year
                FROM {table_name}
                GROUP BY continent_code
            ) latest
              ON latest.continent_code = t.continent_code
             AND latest.year = t.year
            """
        )

    selected_columns = ", ".join(["continent_code"] + columns)
    return fetch_all(f"SELECT {selected_columns} FROM {table_name}")


def _safe_continent_map(table_name, value_columns):
    try:
        return _map_rows(_fetch_latest_continent_rows(table_name, value_columns))
    except Exception:
        return {}


def get_world_overview():
    gdp_row = get_table_row("global_nominal_gdp", "gdp_usd, year")
    population_row = get_table_row("global_population", "population, year")

    if not gdp_row or not population_row:
        return {"live": {}, "stats": {}, "trade": {}}

    start_year = int(gdp_row["year"]) + 1
    population_start_year = int(population_row["year"]) + 1

    growth_row = get_table_row(
        "global_real_gdp_growth",
        "real_growth, year",
        preferred_year=start_year,
    )
    inflation_row = get_table_row(
        "global_inflation",
        "inflation, year",
        preferred_year=start_year,
    )
    population_growth_row = get_table_row(
        "global_population_growth",
        "growth_rate, year",
        preferred_year=population_start_year,
    )
    trade_row = get_table_row(
        "global_trade",
        "exports_usd, imports_usd, trade_balance_usd, year",
        preferred_year=start_year,
    )

    real_growth = clean_number(growth_row.get("real_growth") if growth_row else 0)
    inflation = clean_number(inflation_row.get("inflation") if inflation_row else 0)
    population_growth = clean_number(
        population_growth_row.get("growth_rate") if population_growth_row else 0
    )

    current_gdp = live_nominal_value(gdp_row["gdp_usd"], real_growth, inflation, start_year)
    current_population = live_population_value(
        population_row["population"],
        population_growth,
        population_start_year,
    )

    return {
        "live": {
            "gdp": {
                "baseValue": clean_number(gdp_row["gdp_usd"]),
                "startYear": start_year,
                "realGrowth": real_growth,
                "inflation": inflation,
                "currentValue": current_gdp,
            },
            "population": {
                "baseValue": clean_int(population_row["population"]),
                "startYear": population_start_year,
                "growthRate": population_growth,
                "currentValue": clean_int(current_population),
            },
        },
        "stats": {
            "realGrowth": real_growth,
            "inflation": inflation,
            "nominalGrowth": (real_growth or 0) + (inflation or 0),
            "baseGdpYear": int(gdp_row["year"]),
            "basePopulationYear": int(population_row["year"]),
            "gdpPerCapita": current_gdp / current_population if current_population else None,
        },
        "trade": {
            "year": int(trade_row["year"]) if trade_row and trade_row.get("year") else None,
            "exportsUsd": clean_number(trade_row.get("exports_usd")) if trade_row else None,
            "importsUsd": clean_number(trade_row.get("imports_usd")) if trade_row else None,
            "tradeBalanceUsd": clean_number(trade_row.get("trade_balance_usd")) if trade_row else None,
        },
    }


def get_continent_list():
    continents = fetch_all("SELECT code, name FROM continents WHERE code <> 'AN' ORDER BY name")
    gdp_rows = _safe_continent_map("continent_nominal_gdp", ["gdp_usd"])
    population_rows = _safe_continent_map("continent_population", ["population"])
    trade_rows = _safe_continent_map(
        "continent_trade",
        ["exports_usd", "imports_usd", "trade_balance_usd"],
    )
    gdp_per_capita_rows = _safe_continent_map("continent_gdp_per_capita", ["gdp_per_capita_usd"])
    growth_rows = _safe_continent_map("continent_real_gdp_growth", ["real_growth"])
    inflation_rows = _safe_continent_map("continent_inflation", ["inflation"])
    pop_growth_rows = _safe_continent_map("continent_population_growth", ["growth_rate"])
    share_rows = _safe_continent_map("continent_world_gdp_share", ["pct_of_world"])

    items = []

    for continent in continents:
        code = continent["code"]
        gdp_row = gdp_rows.get(code)
        pop_row = population_rows.get(code)
        trade_row = trade_rows.get(code)
        gdp_per_capita_row = gdp_per_capita_rows.get(code)

        start_year = int(gdp_row["year"]) + 1 if gdp_row and gdp_row.get("year") else utc_year()
        pop_start_year = int(pop_row["year"]) + 1 if pop_row and pop_row.get("year") else utc_year()

        growth_row = growth_rows.get(code)
        inflation_row = inflation_rows.get(code)
        pop_growth_row = pop_growth_rows.get(code)
        share_row = share_rows.get(code)

        real_growth = clean_number(growth_row.get("real_growth") if growth_row else 0)
        inflation = clean_number(inflation_row.get("inflation") if inflation_row else 0)
        population_growth = clean_number(pop_growth_row.get("growth_rate") if pop_growth_row else 0)
        base_gdp_usd = (
            clean_number(gdp_row.get("gdp_usd")) * 1e9
            if gdp_row and gdp_row.get("gdp_usd") is not None
            else None
        )

        live_gdp = live_nominal_value(
            base_gdp_usd,
            real_growth,
            inflation,
            start_year,
        )
        live_population = live_population_value(
            pop_row.get("population") if pop_row else 0,
            population_growth,
            pop_start_year,
        )

        items.append(
            {
                "code": code,
                "name": continent["name"],
                "liveGdpUsd": live_gdp,
                "livePopulation": clean_int(live_population),
                "baseGdpUsd": base_gdp_usd,
                "baseGdpYear": int(gdp_row["year"]) if gdp_row and gdp_row.get("year") else None,
                "realGrowth": real_growth,
                "inflation": inflation,
                "populationGrowth": population_growth,
                "gdpPerCapitaUsd": clean_number(gdp_per_capita_row.get("gdp_per_capita_usd")) if gdp_per_capita_row else None,
                "shareOfWorld": clean_number(share_row.get("pct_of_world")) if share_row else None,
                "trade": {
                    "exportsUsd": (
                        clean_number(trade_row.get("exports_usd")) * 1e12
                        if trade_row and trade_row.get("exports_usd") is not None
                        else None
                    ),
                    "importsUsd": (
                        clean_number(trade_row.get("imports_usd")) * 1e12
                        if trade_row and trade_row.get("imports_usd") is not None
                        else None
                    ),
                    "tradeBalanceUsd": (
                        clean_number(trade_row.get("trade_balance_usd")) * 1e12
                        if trade_row and trade_row.get("trade_balance_usd") is not None
                        else None
                    ),
                    "year": int(trade_row["year"]) if trade_row and trade_row.get("year") else None,
                },
                "liveConfig": {
                    "gdp": {
                        "baseValue": base_gdp_usd or 0,
                        "startYear": start_year,
                        "realGrowth": real_growth,
                        "inflation": inflation,
                    },
                    "population": {
                        "baseValue": clean_number(pop_row.get("population")) if pop_row else 0,
                        "startYear": pop_start_year,
                        "growthRate": population_growth,
                    },
                },
            }
        )

    return items


def get_continent_detail(continent_code):
    continent = fetch_one(
        "SELECT code, name FROM continents WHERE code = %s LIMIT 1",
        (continent_code,),
    )
    if not continent:
        return None

    items = get_continent_list()
    selected = next((item for item in items if item["code"] == continent_code), None)

    top_countries = fetch_all(
        """
        SELECT c.name AS country, ei.gdp, ei.gdp_growth, ei.inflation, ei.year
        FROM countries c
        JOIN (
            SELECT country_id, MAX(year) AS year
            FROM economic_indicators
            GROUP BY country_id
        ) latest ON latest.country_id = c.country_id
        JOIN economic_indicators ei
          ON ei.country_id = latest.country_id
         AND ei.year = latest.year
        WHERE c.continent_code = %s
          AND ei.gdp IS NOT NULL
        ORDER BY ei.gdp DESC
        LIMIT 7
        """,
        (continent_code,),
    )

    return {
        "continent": selected,
        "topCountries": [
            {
                "country": row.get("country"),
                "gdpUsd": clean_number(row.get("gdp")),
                "liveGdpUsd": live_nominal_value(
                    row.get("gdp"),
                    row.get("gdp_growth"),
                    row.get("inflation"),
                    (int(row["year"]) + 1) if row.get("year") else utc_year(),
                ) if row.get("gdp") is not None else None,
                "shareOfContinent": (
                    (
                        live_nominal_value(
                            row.get("gdp"),
                            row.get("gdp_growth"),
                            row.get("inflation"),
                            (int(row["year"]) + 1) if row.get("year") else utc_year(),
                        )
                        / selected["liveGdpUsd"]
                    ) * 100
                    if selected and selected.get("liveGdpUsd") and row.get("gdp") is not None
                    else None
                ),
                "year": int(row["year"]) if row.get("year") else None,
            }
            for row in top_countries
        ],
    }
