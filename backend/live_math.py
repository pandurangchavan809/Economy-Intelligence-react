from datetime import datetime, timezone


SECONDS_IN_YEAR = 365 * 24 * 60 * 60


def live_nominal_value(base_value, real_growth, inflation, start_year):
    effective_growth = ((real_growth or 0) + (inflation or 0)) / 100
    start = datetime(int(start_year), 1, 1, tzinfo=timezone.utc)
    elapsed = max((datetime.now(timezone.utc) - start).total_seconds(), 0)
    return float(base_value or 0) * (1 + effective_growth * elapsed / SECONDS_IN_YEAR)


def live_population_value(base_population, growth_rate, start_year):
    growth = (growth_rate or 0) / 100
    start = datetime(int(start_year), 1, 1, tzinfo=timezone.utc)
    elapsed = max((datetime.now(timezone.utc) - start).total_seconds(), 0)
    return float(base_population or 0) * (1 + growth * elapsed / SECONDS_IN_YEAR)
