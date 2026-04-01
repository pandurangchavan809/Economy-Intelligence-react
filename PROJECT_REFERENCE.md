# Project Reference Map

This project now has two app layers:

- `backend/` for the Flask API
- `frontend/` for the React + Tailwind UI

## Current App Entry Points

- Backend app: `backend/app.py`
- Frontend app: `frontend/src/App.jsx`

## Backend File References

- `backend/config.py` loads environment variables and app settings.
- `backend/db.py` handles MySQL connection, reads, writes, and table metadata checks.
- `backend/live_math.py` keeps the live GDP and population counter formulas.
- `backend/dashboard_service.py` serves world and continent data.
- `backend/country_service.py` serves country list and country detail data.
- `backend/ai_service.py` handles the Gemini country analyst response and the Gemini intelligence page data.
- `backend/admin_service.py` handles admin summary, table preview, and SQL execution.
- `backend/auth.py` creates and validates admin JWT tokens.
- `backend/requirements.txt` contains the Python packages for the Flask backend.

## Frontend File References

- `frontend/src/App.jsx` defines the page routes.
- `frontend/src/api.js` contains the API request helpers.
- `frontend/src/hooks/useLiveMetric.js` updates the live counters every second.
- `frontend/src/utils/live.js` contains the frontend live-counter formulas.
- `frontend/src/utils/formatters.js` contains the UI formatting helpers.
- `frontend/src/components/Layout.jsx` contains the shared shell and navigation.
- `frontend/src/components/MetricCard.jsx` contains the reusable metric card.
- `frontend/src/components/SectionHeading.jsx` contains the reusable section header.
- `frontend/src/pages/HomePage.jsx` is the landing page.
- `frontend/src/pages/GeminiPage.jsx` is the Gemini intelligence page with charts and consultant chat.
- `frontend/src/pages/WorldPage.jsx` is the world intelligence page.
- `frontend/src/pages/ContinentsPage.jsx` is the continent intelligence page.
- `frontend/src/pages/CountriesPage.jsx` is the country intelligence page and AI analyst UI.
- `frontend/src/pages/AdminPage.jsx` is the admin login and control page.

## Run Commands

Backend:

```bash
python -m backend.app
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
