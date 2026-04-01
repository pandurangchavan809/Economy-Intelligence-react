try:
    from .currency import get_rate_by_country_name
    from .data_helpers import clean_int, clean_number, get_table_row, utc_year
    from .db import fetch_all, fetch_one, table_has_column
    from .live_math import live_nominal_value, live_population_value
except ImportError:
    from currency import get_rate_by_country_name
    from data_helpers import clean_int, clean_number, get_table_row, utc_year
    from db import fetch_all, fetch_one, table_has_column
    from live_math import live_nominal_value, live_population_value


def get_country_list():
    rows = fetch_all(
        "SELECT country_id, name, iso3, flag_url, continent_code FROM countries ORDER BY name"
    )
    return [
        {
            "countryId": int(row["country_id"]),
            "name": row["name"],
            "iso3": row.get("iso3"),
            "flagUrl": row.get("flag_url"),
            "continentCode": row.get("continent_code"),
        }
        for row in rows
    ]


def get_country_indicator(country_id):
    return fetch_one(
        """
        SELECT *
        FROM economic_indicators
        WHERE country_id = %s
        ORDER BY year DESC
        LIMIT 1
        """,
        (country_id,),
    )


def get_country_population(country_id):
    if table_has_column("country_population", "population"):
        row = fetch_one(
            """
            SELECT population, year
            FROM country_population
            WHERE country_id = %s AND population IS NOT NULL
            ORDER BY year DESC
            LIMIT 1
            """,
            (country_id,),
        )
        if row:
            return row

    if table_has_column("economic_indicators", "population"):
        return fetch_one(
            """
            SELECT population, year
            FROM economic_indicators
            WHERE country_id = %s AND population IS NOT NULL
            ORDER BY year DESC
            LIMIT 1
            """,
            (country_id,),
        )

    return None


def get_population_growth(country_id):
    if table_has_column("country_population_growth", "population_growth"):
        row = fetch_one(
            """
            SELECT population_growth, year
            FROM country_population_growth
            WHERE country_id = %s
            ORDER BY year DESC
            LIMIT 1
            """,
            (country_id,),
        )
        if row:
            return clean_number(row["population_growth"])

    if table_has_column("country_population", "population"):
        rows = fetch_all(
            """
            SELECT population, year
            FROM country_population
            WHERE country_id = %s AND population IS NOT NULL
            ORDER BY year DESC
            LIMIT 2
            """,
            (country_id,),
        )
        if len(rows) == 2:
            latest = float(rows[0]["population"])
            previous = float(rows[1]["population"])
            if previous:
                return ((latest - previous) / previous) * 100

    return None


def get_country_trade(country_id):
    if not table_has_column("country_trade", "exports_usd"):
        return None

    return fetch_one(
        """
        SELECT exports_usd, imports_usd, trade_balance_usd, year
        FROM country_trade
        WHERE country_id = %s
        ORDER BY year DESC
        LIMIT 1
        """,
        (country_id,),
    )


def get_country_shares(country_id, iso3, continent_code, year):
    share_of_continent = None
    share_of_world = None

    if table_has_column("country_continent_gdp_share", "pct_of_continent"):
        if iso3 and table_has_column("country_continent_gdp_share", "iso3"):
            row = fetch_one(
                """
                SELECT pct_of_continent
                FROM country_continent_gdp_share
                WHERE iso3 = %s AND year = %s
                LIMIT 1
                """,
                (iso3, year),
            )
            if row:
                share_of_continent = clean_number(row["pct_of_continent"])

        if share_of_continent is None:
            country_row = fetch_one("SELECT name FROM countries WHERE country_id = %s LIMIT 1", (country_id,))
            if country_row:
                row = fetch_one(
                    """
                    SELECT pct_of_continent
                    FROM country_continent_gdp_share
                    WHERE country = %s AND year = %s
                    LIMIT 1
                    """,
                    (country_row["name"], year),
                )
                if row:
                    share_of_continent = clean_number(row["pct_of_continent"])

    if table_has_column("country_world_gdp_share", "pct_of_world"):
        if iso3 and table_has_column("country_world_gdp_share", "iso3"):
            row = fetch_one(
                """
                SELECT pct_of_world
                FROM country_world_gdp_share
                WHERE iso3 = %s AND year = %s
                LIMIT 1
                """,
                (iso3, year),
            )
            if row:
                share_of_world = clean_number(row["pct_of_world"])

        if share_of_world is None:
            country_row = fetch_one("SELECT name FROM countries WHERE country_id = %s LIMIT 1", (country_id,))
            if country_row:
                row = fetch_one(
                    """
                    SELECT pct_of_world
                    FROM country_world_gdp_share
                    WHERE country = %s AND year = %s
                    LIMIT 1
                    """,
                    (country_row["name"], year),
                )
                if row:
                    share_of_world = clean_number(row["pct_of_world"])

    if share_of_continent is None or share_of_world is None:
        gdp_row = fetch_one(
            """
            SELECT gdp
            FROM economic_indicators
            WHERE country_id = %s AND year = %s
            LIMIT 1
            """,
            (country_id, year),
        ) or fetch_one(
            """
            SELECT gdp, year
            FROM economic_indicators
            WHERE country_id = %s AND gdp IS NOT NULL
            ORDER BY year DESC
            LIMIT 1
            """,
            (country_id,),
        )

        country_gdp = clean_number(gdp_row["gdp"]) if gdp_row else None

        if share_of_continent is None and country_gdp is not None and continent_code:
            continent_row = fetch_one(
                """
                SELECT gdp_usd
                FROM continent_nominal_gdp
                WHERE continent_code = %s AND year = %s
                LIMIT 1
                """,
                (continent_code, year),
            )
            if continent_row and continent_row.get("gdp_usd"):
                share_of_continent = country_gdp / (float(continent_row["gdp_usd"]) * 1e9) * 100

        if share_of_world is None and country_gdp is not None:
            world_row = fetch_one(
                """
                SELECT SUM(gdp_usd) AS world_sum_billion
                FROM continent_nominal_gdp
                WHERE year = %s
                """,
                (year,),
            )
            if world_row and world_row.get("world_sum_billion"):
                share_of_world = country_gdp / (float(world_row["world_sum_billion"]) * 1e9) * 100

    return share_of_continent, share_of_world


def get_country_detail(country_id):
    meta = fetch_one(
        """
        SELECT country_id, name, iso2, iso3, capital, continent, continent_code, flag_url
        FROM countries
        WHERE country_id = %s
        LIMIT 1
        """,
        (country_id,),
    )
    if not meta:
        return None

    indicator = get_country_indicator(country_id)
    population_row = get_country_population(country_id)
    population_growth = get_population_growth(country_id)
    trade_row = get_country_trade(country_id)

    indicator_year = int(indicator["year"]) if indicator and indicator.get("year") else None
    gdp_start_year = indicator_year + 1 if indicator_year else utc_year()
    population_year = int(population_row["year"]) if population_row and population_row.get("year") else indicator_year
    population_start_year = population_year + 1 if population_year else utc_year()

    live_gdp = None
    if indicator and indicator.get("gdp") is not None:
        live_gdp = live_nominal_value(
            indicator["gdp"],
            indicator.get("gdp_growth"),
            indicator.get("inflation"),
            gdp_start_year,
        )

    live_population = None
    if population_row and population_row.get("population") is not None:
        live_population = live_population_value(
            population_row["population"],
            population_growth,
            population_start_year,
        )

    share_of_continent, share_of_world = get_country_shares(
        country_id,
        meta.get("iso3"),
        meta.get("continent_code"),
        indicator_year or utc_year(),
    )

    exchange_rate, currency_code = get_rate_by_country_name(meta["name"])
    military_spending = None
    if indicator:
        military_spending = indicator.get("military_spending") or indicator.get("military")

    if military_spending is None and table_has_column("country_military_share", "military_spending"):
        row = get_table_row(
            "country_military_share",
            "military_spending, year",
            filters={"country": meta["name"]},
        )
        if row:
            military_spending = row.get("military_spending")

    return {
        "country": {
            "countryId": int(meta["country_id"]),
            "name": meta["name"],
            "iso2": meta.get("iso2"),
            "iso3": meta.get("iso3"),
            "capital": meta.get("capital"),
            "continent": meta.get("continent"),
            "continentCode": meta.get("continent_code"),
            "flagUrl": meta.get("flag_url"),
        },
        "live": {
            "gdp": {
                "baseValue": clean_number(indicator.get("gdp")) if indicator else None,
                "startYear": gdp_start_year,
                "realGrowth": clean_number(indicator.get("gdp_growth")) if indicator else None,
                "inflation": clean_number(indicator.get("inflation")) if indicator else None,
                "currentValue": live_gdp,
            },
            "population": {
                "baseValue": clean_int(population_row.get("population")) if population_row else None,
                "startYear": population_start_year,
                "growthRate": population_growth,
                "currentValue": clean_int(live_population) if live_population else None,
            },
        },
        "metrics": {
            "indicatorYear": indicator_year,
            "realGrowth": clean_number(indicator.get("gdp_growth")) if indicator else None,
            "inflation": clean_number(indicator.get("inflation")) if indicator else None,
            "nominalGrowth": (
                clean_number(indicator.get("gdp_growth") or 0)
                + clean_number(indicator.get("inflation") or 0)
            ) if indicator else None,
            "gdpPerCapitaUsd": live_gdp / live_population if live_gdp and live_population else None,
            "unemployment": clean_number(indicator.get("unemployment")) if indicator else None,
            "debtToGdp": clean_number(indicator.get("debt_gdp") or indicator.get("debt_to_gdp")) if indicator else None,
            "militarySpendingUsd": clean_number(military_spending),
            "shareOfContinent": share_of_continent,
            "shareOfWorld": share_of_world,
            "trade": {
                "exportsUsd": clean_number(trade_row.get("exports_usd")) if trade_row else None,
                "importsUsd": clean_number(trade_row.get("imports_usd")) if trade_row else None,
                "tradeBalanceUsd": clean_number(trade_row.get("trade_balance_usd")) if trade_row else None,
                "year": int(trade_row["year"]) if trade_row and trade_row.get("year") else None,
            },
            "exchangeRate": {
                "rate": clean_number(exchange_rate),
                "code": currency_code,
            },
        },
    }
