from functools import lru_cache
from threading import Lock
from time import time

import requests
from countryinfo import CountryInfo

try:
    from .config import Config
except ImportError:
    from config import Config


_SESSION = requests.Session()
_RATES_LOCK = Lock()
_RATES_CACHE = {
    "rates": {},
    "fetched_at": 0.0,
}


@lru_cache(maxsize=256)
def get_currency_code_by_country_name(country_name):
    if not country_name:
        return None

    try:
        country = CountryInfo(country_name)
        currencies = country.currencies()
        if not currencies:
            return None
        return currencies[0]
    except Exception:
        return None


def _fetch_usd_rates():
    response = _SESSION.get(
        Config.FX_API_URL,
        timeout=Config.FX_REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    rates = payload.get("rates") or {}
    return rates if isinstance(rates, dict) else {}


def get_usd_rates():
    now = time()

    with _RATES_LOCK:
        cached_rates = dict(_RATES_CACHE["rates"])
        fetched_at = _RATES_CACHE["fetched_at"]
        if cached_rates and now - fetched_at < Config.FX_CACHE_TTL_SECONDS:
            return cached_rates

    try:
        fresh_rates = _fetch_usd_rates()
    except Exception:
        return cached_rates

    if not fresh_rates:
        return cached_rates

    with _RATES_LOCK:
        _RATES_CACHE["rates"] = fresh_rates
        _RATES_CACHE["fetched_at"] = now

    return dict(fresh_rates)


def get_rate_by_country_name(country_name):
    currency_code = get_currency_code_by_country_name(country_name)
    if not currency_code:
        return None, None

    rates = get_usd_rates()
    if not rates:
        return None, currency_code

    rate = rates.get(currency_code)
    return rate, currency_code
