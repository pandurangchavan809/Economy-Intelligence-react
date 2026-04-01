# Economy Intelligence

Economy Intelligence is now split into:

- `backend/` - Flask API
- `frontend/` - React + Tailwind app

The app keeps your existing Aiven MySQL database and core dashboard logic, but serves it through a cleaner interview-friendly stack.

## Stack

- Flask
- React
- Tailwind CSS
- Aiven MySQL
- Gemini for the country assistant

## Project Structure

```text
/
|- backend/
|- frontend/
|- .env.example
|- .gitignore
|- README.md
|- PROJECT_REFERENCE.md
`- LICENSE
```

Detailed app structure:

```text
backend/
  app.py
  config.py
  db.py
  dashboard_service.py
  country_service.py
  admin_service.py
  ai_service.py

frontend/
  src/
    pages/
    components/
    hooks/
    utils/
```

## Environment

Root `.env` should contain:

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL_DISABLED=false

ADMIN_ID=
ADMIN_PASS=
JWT_SECRET=
JWT_EXPIRES_HOURS=12

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

FLASK_PORT=5000
FLASK_DEBUG=true
FRONTEND_ORIGIN=http://localhost:5173
```

Frontend `frontend/.env` can contain:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run Locally

### 1. Backend

Install backend packages:

```bash
pip install -r backend/requirements.txt
```

Run Flask:

```bash
python -m backend.app
```

Backend default URL:

```text
http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## API Routes

Public routes:

- `GET /api/health`
- `GET /api/world`
- `GET /api/continents`
- `GET /api/continents/<code>`
- `GET /api/countries`
- `GET /api/countries/<country_id>`
- `POST /api/assistant/chat`
- `GET /api/gemini/intelligence?country=Japan`
- `POST /api/gemini/consultant`

Admin routes:

- `POST /api/admin/login`
- `GET /api/admin/summary`
- `GET /api/admin/tables`
- `GET /api/admin/table-data?table=...`
- `POST /api/admin/query`

## Deployment

Full step-by-step deployment instructions live in [DEPLOYMENT.md](DEPLOYMENT.md).

### Option A: Recommended

- Deploy `frontend/` to Vercel
- Deploy `backend/` to Render, Railway, Fly.io, or any Python host
- Point `VITE_API_BASE_URL` to your deployed Flask API
- Set `FRONTEND_ORIGIN` in the backend to your Vercel domain
- Keep Aiven MySQL as the shared database

This is the cleanest setup for your current codebase.

### Option B: Vercel Frontend Only

You can deploy only the React frontend to Vercel, but it still needs a backend API somewhere.

Important:

- Do not connect React directly to Aiven MySQL from the browser
- Do not expose DB credentials in frontend code
- Streamlit itself is not a proper backend API for a production React app unless you build API endpoints separately

## Verified Status

Tested successfully against the current configured database on March 31, 2026:

- `GET /api/health`
- `GET /api/world`
- `GET /api/countries`
- `GET /api/continents`
- `GET /api/continents/AS`
- `GET /api/countries/99`
- `POST /api/admin/login`
- `GET /api/admin/summary`
- `GET /api/admin/table-data?table=countries`
- `POST /api/admin/query` with a safe read-only `SELECT`

## Notes

- `PROJECT_REFERENCE.md` contains the file reference map for future edits.
- Legacy Streamlit, ETL, and ML folders have been removed to keep the repo focused on the final Flask + React architecture.
