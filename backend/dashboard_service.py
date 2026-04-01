try:
    from .data_helpers import clean_int, clean_number, get_table_row, utc_year
    from .db import fetch_all, fetch_one, table_has_column
    from .live_math import live_nominal_value, live_population_value
except ImportError:
    from data_helpers import clean_int, clean_number, get_table_row, utc_year
    from db import fetch_all, fetch_one, table_has_column
    from live_math import live_nominal_value, live_population_value


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
    growth_has_year = table_has_column("continent_real_gdp_growth", "year")
    inflation_has_year = table_has_column("continent_inflation", "year")
    pop_growth_has_year = table_has_column("continent_population_growth", "year")
    share_has_year = table_has_column("continent_world_gdp_share", "year")

    items = []

    for continent in continents:
        code = continent["code"]
        gdp_row = get_table_row(
            "continent_nominal_gdp",
            "gdp_usd, year",
            filters={"continent_code": code},
        )
        pop_row = get_table_row(
            "continent_population",
            "population, year",
            filters={"continent_code": code},
        )
        trade_row = get_table_row(
            "continent_trade",
            "exports_usd, imports_usd, trade_balance_usd, year",
            filters={"continent_code": code},
        )
        gdp_per_capita_row = get_table_row(
            "continent_gdp_per_capita",
            "gdp_per_capita_usd, year",
            filters={"continent_code": code},
        )

        start_year = int(gdp_row["year"]) + 1 if gdp_row and gdp_row.get("year") else utc_year()
        pop_start_year = int(pop_row["year"]) + 1 if pop_row and pop_row.get("year") else utc_year()

        growth_row = get_table_row(
            "continent_real_gdp_growth",
            "real_growth" + (", year" if growth_has_year else ""),
            filters={"continent_code": code},
            preferred_year=start_year,
        )
        inflation_row = get_table_row(
            "continent_inflation",
            "inflation" + (", year" if inflation_has_year else ""),
            filters={"continent_code": code},
            preferred_year=start_year,
        )
        pop_growth_row = get_table_row(
            "continent_population_growth",
            "growth_rate" + (", year" if pop_growth_has_year else ""),
            filters={"continent_code": code},
            preferred_year=pop_start_year,
        )
        share_row = get_table_row(
            "continent_world_gdp_share",
            "pct_of_world" + (", year" if share_has_year else ""),
            filters={"continent_code": code},
            preferred_year=gdp_row["year"] if gdp_row and gdp_row.get("year") else None,
        )

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

    top_countries = []
    if table_has_column("continent_country_gdp_share", "continent_code"):
        top_countries = fetch_all(
            """
            SELECT country, gdp, pct_of_continent, year
            FROM continent_country_gdp_share
            WHERE continent_code = %s
            ORDER BY year DESC, gdp DESC
            LIMIT 7
            """,
            (continent_code,),
        )

    if not top_countries:
        top_countries = fetch_all(
            """
            SELECT c.name AS country, ei.gdp, NULL AS pct_of_continent, ei.year
            FROM countries c
            JOIN economic_indicators ei ON ei.country_id = c.country_id
            WHERE c.continent_code = %s
              AND ei.year = (
                  SELECT MAX(ei2.year)
                  FROM economic_indicators ei2
                  WHERE ei2.country_id = c.country_id
              )
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
                "shareOfContinent": clean_number(row.get("pct_of_continent")),
                "year": int(row["year"]) if row.get("year") else None,
            }
            for row in top_countries
        ],
    }
