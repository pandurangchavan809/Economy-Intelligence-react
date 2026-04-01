from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

try:
    from .admin_service import (
        get_admin_summary,
        get_admin_table_data,
        get_admin_tables,
        run_admin_query,
    )
    from .ai_service import (
        ask_country_assistant,
        ask_gemini_consultant,
        get_gemini_country_intelligence,
    )
    from .auth import admin_required, create_token
    from .config import Config
    from .country_service import get_country_detail, get_country_list
    from .dashboard_service import get_continent_detail, get_continent_list, get_world_overview
except ImportError:
    from admin_service import (
        get_admin_summary,
        get_admin_table_data,
        get_admin_tables,
        run_admin_query,
    )
    from ai_service import ask_country_assistant, ask_gemini_consultant, get_gemini_country_intelligence
    from auth import admin_required, create_token
    from config import Config
    from country_service import get_country_detail, get_country_list
    from dashboard_service import get_continent_detail, get_continent_list, get_world_overview


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.FRONTEND_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "OPTIONS"],
    )

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/world")
    def world():
        return jsonify(get_world_overview())

    @app.get("/api/continents")
    def continents():
        return jsonify(get_continent_list())

    @app.get("/api/continents/<string:continent_code>")
    def continent_detail(continent_code):
        detail = get_continent_detail(continent_code.upper())
        if not detail:
            return jsonify({"error": "Continent not found"}), 404
        return jsonify(detail)

    @app.get("/api/countries")
    def countries():
        return jsonify(get_country_list())

    @app.get("/api/countries/<int:country_id>")
    def country_detail(country_id):
        detail = get_country_detail(country_id)
        if not detail:
            return jsonify({"error": "Country not found"}), 404
        return jsonify(detail)

    @app.post("/api/assistant/chat")
    def assistant_chat():
        payload = request.get_json(silent=True) or {}
        country_id = payload.get("countryId")
        question = (payload.get("question") or "").strip()

        if not country_id or not question:
            return jsonify({"error": "countryId and question are required"}), 400

        return jsonify(ask_country_assistant(country_id, question))

    @app.get("/api/gemini/intelligence")
    def gemini_intelligence():
        country = (request.args.get("country") or "Japan").strip()
        if not country:
            return jsonify({"error": "country is required"}), 400

        return jsonify(get_gemini_country_intelligence(country))

    @app.post("/api/gemini/consultant")
    def gemini_consultant():
        payload = request.get_json(silent=True) or {}
        country = (payload.get("country") or "").strip()
        question = (payload.get("question") or "").strip()

        if not country or not question:
            return jsonify({"error": "country and question are required"}), 400

        return jsonify(ask_gemini_consultant(country, question))

    @app.post("/api/admin/login")
    def admin_login():
        payload = request.get_json(silent=True) or {}
        admin_id = (payload.get("adminId") or "").strip()
        password = payload.get("password") or ""

        if admin_id != Config.ADMIN_ID or password != Config.ADMIN_PASS:
            return jsonify({"error": "Invalid admin credentials"}), 401

        return jsonify(
            {
                "token": create_token(admin_id),
                "adminId": admin_id,
            }
        )

    @app.get("/api/admin/summary")
    @admin_required
    def admin_summary():
        return jsonify(get_admin_summary())

    @app.get("/api/admin/tables")
    @admin_required
    def admin_tables():
        return jsonify(get_admin_tables())

    @app.get("/api/admin/table-data")
    @admin_required
    def admin_table_data():
        table_name = request.args.get("table", "").strip()
        country_id = request.args.get("countryId", type=int)

        if not table_name:
            return jsonify({"error": "table is required"}), 400

        try:
            return jsonify(get_admin_table_data(table_name, country_id=country_id))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

    @app.post("/api/admin/query")
    @admin_required
    def admin_query():
        payload = request.get_json(silent=True) or {}
        query = (payload.get("query") or "").strip()

        if not query:
            return jsonify({"error": "query is required"}), 400

        return jsonify(run_admin_query(query))

    @app.errorhandler(Exception)
    def handle_error(error):
        if isinstance(error, HTTPException):
            return jsonify({"error": error.description or error.name}), error.code
        return jsonify({"error": str(error)}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
