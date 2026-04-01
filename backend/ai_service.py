import json
import re
from functools import lru_cache

try:
    from .config import Config
    from .country_service import get_country_detail
except ImportError:
    from config import Config
    from country_service import get_country_detail


def _get_model():
    if not Config.GEMINI_API_KEY:
        raise RuntimeError("Gemini API key is not configured yet. Add GEMINI_API_KEY to use this page.")

    try:
        import google.generativeai as genai
    except ImportError as error:
        raise RuntimeError(
            "google-generativeai is not installed yet. Install backend requirements to use Gemini."
        ) from error

    genai.configure(api_key=Config.GEMINI_API_KEY)
    return genai.GenerativeModel(Config.GEMINI_MODEL)


def _parse_json_block(raw_text):
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise RuntimeError("Gemini did not return valid JSON.")
        return json.loads(match.group(0))


def _normalize_history_payload(country, payload):
    rows = []
    for row in payload.get("data", []):
        try:
            rows.append(
                {
                    "year": int(row["year"]),
                    "gdp": float(row["gdp"]),
                    "inflation": float(row["inflation"]),
                    "unemp": float(row["unemp"]),
                    "fdi": float(row["fdi"]),
                }
            )
        except (KeyError, TypeError, ValueError):
            continue

    rows.sort(key=lambda item: item["year"])

    if not rows:
        raise RuntimeError(f"Gemini did not return usable historical data for {country}.")

    return {
        "country": country,
        "summary": payload.get("summary", "").strip(),
        "data": rows,
        "model": Config.GEMINI_MODEL,
    }


@lru_cache(maxsize=24)
def get_gemini_country_intelligence(country):
    country_name = (country or "").strip()
    if not country_name:
        raise RuntimeError("Country is required.")

    model = _get_model()
    prompt = f"""
    Act as a senior economic researcher. Generate a JSON object for {country_name} for years 2015 to 2025.
    Rules:
    1. GDP must be in nominal USD billions.
    2. Inflation, unemployment, and FDI must be realistic percentages.
    3. Return only raw JSON using this schema:
    {{
      "data": [
        {{"year": 2015, "gdp": 4444.0, "inflation": 0.8, "unemp": 3.4, "fdi": 0.1}}
      ],
      "summary": "1-sentence expert trend summary."
    }}
    """

    response = model.generate_content(prompt)
    return _normalize_history_payload(country_name, _parse_json_block(response.text))


def ask_gemini_consultant(country, question):
    country_name = (country or "").strip()
    user_question = (question or "").strip()

    if not country_name or not user_question:
        raise RuntimeError("Country and question are required.")

    model = _get_model()
    response = model.generate_content(f"Analyze {country_name}: {user_question}")
    return {
        "country": country_name,
        "answer": response.text,
    }


def ask_country_assistant(country_id, question):
    detail = get_country_detail(country_id)
    if not detail:
        return {"answer": "Country not found."}

    if not Config.GEMINI_API_KEY:
        return {
            "answer": "Gemini API key is not configured yet. Add GEMINI_API_KEY to use the AI analyst.",
        }

    try:
        model = _get_model()
    except RuntimeError as error:
        return {
            "answer": str(error),
        }

    country = detail["country"]
    metrics = detail["metrics"]
    live = detail["live"]

    prompt = f"""
    You are an economic analyst.
    Use only the facts below. If something is missing, say it is not available.

    Country: {country['name']}
    Capital: {country.get('capital')}
    Continent: {country.get('continent')}
    Latest indicator year: {metrics.get('indicatorYear')}
    Live GDP USD: {live['gdp'].get('currentValue')}
    Live population: {live['population'].get('currentValue')}
    Real GDP growth: {metrics.get('realGrowth')}
    Inflation: {metrics.get('inflation')}
    Unemployment: {metrics.get('unemployment')}
    Debt to GDP: {metrics.get('debtToGdp')}
    Trade balance USD: {metrics['trade'].get('tradeBalanceUsd')}
    Share of world GDP: {metrics.get('shareOfWorld')}

    User question: {question}

    Keep the answer short, practical, and explainable for a dashboard user.
    """

    response = model.generate_content(prompt)
    return {"answer": response.text}
