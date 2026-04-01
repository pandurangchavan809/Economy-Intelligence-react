def get_rate_by_country_name(country_name):
    try:
        import requests
        from countryinfo import CountryInfo

        country = CountryInfo(country_name)
        currencies = country.currencies()
        if not currencies:
            return None, None

        currency_code = currencies[0]
        response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=5)
        response.raise_for_status()
        rate = response.json().get("rates", {}).get(currency_code)
        return rate, currency_code
    except Exception:
        return None, None
