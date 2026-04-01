# Deployment Guide

This project is best deployed as two separate services:

- `frontend/` -> static React app
- `backend/` -> Flask API
- MySQL -> existing managed database such as Aiven

The recommended setup is:

- deploy the frontend to Vercel or Netlify
- deploy the backend to Render, Railway, Fly.io, or another Python host
- keep the database outside the app host

## Recommended Architecture

```text
Browser
  -> Frontend (Vercel/Netlify)
  -> Backend API (Render/Railway/Fly.io)
  -> MySQL database (Aiven or other managed MySQL)
```

The frontend must talk to the backend through `VITE_API_BASE_URL`.
The backend must allow the frontend origin through `FRONTEND_ORIGIN`.

## Backend Environment Variables

Set these in your backend hosting dashboard instead of committing a `.env` file:

| Variable | Required | Notes |
| --- | --- | --- |
| `COUNTRYLAYER_API_KEY` | Yes | Required by the app. |
| `WORLD_BANK_API_KEY` | No | Leave empty if unused. |
| `IMF_API_KEY` | No | Leave empty if unused. |
| `DB_HOST` | Yes | MySQL host. |
| `DB_PORT` | Yes | Usually `3306`. |
| `DB_USER` | Yes | MySQL username. |
| `DB_PASSWORD` | Yes | MySQL password. |
| `DB_NAME` | Yes | Database name. |
| `DB_SSL_DISABLED` | Yes | Use `false` for Aiven or other SSL-enabled MySQL hosts. |
| `GEMINI_API_KEY` | Yes | Required for Gemini endpoints. |
| `GEMINI_MODEL` | No | Default is `gemini-2.5-flash`. |
| `FLASK_DEBUG` | Yes | Set this to `false` in production. |
| `FRONTEND_ORIGIN` | Yes | Exact frontend URL, for example `https://your-app.vercel.app`. |
| `ADMIN_ID` | Yes | Change the default value before going live. |
| `ADMIN_PASS` | Yes | Change the default value before going live. |
| `JWT_SECRET` | Yes | Use a long random secret in production. |
| `JWT_EXPIRES_HOURS` | No | Default is `12`. |

Notes:

- `FRONTEND_ORIGIN` should be a single exact origin without a trailing slash.
- The current backend CORS setup allows one production frontend origin plus local `http://127.0.0.1:5173`.
- If you use preview deployments with changing URLs, use a stable custom frontend domain for production.

## Frontend Environment Variables

Set this in your frontend hosting dashboard:

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Must point to the deployed backend API base, for example `https://your-backend.onrender.com/api`. |

Important:

- Include `/api` in `VITE_API_BASE_URL`.
- Do not place database credentials or Gemini keys in the frontend environment.

## Backend Deployment

The backend now supports production hosts more cleanly:

- it binds to `0.0.0.0`
- it accepts the platform `PORT` variable when provided
- `gunicorn` is included in `backend/requirements.txt`

### Generic Python Host Settings

Use these values on Render, Railway, Fly.io, or a similar Python host:

- Root directory: repository root
- Build command: `pip install -r backend/requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT backend.app:app`

If your platform does not provide `PORT`, you can still run:

```bash
python -m backend.app
```

### Backend Smoke Test

After deployment, open:

```text
https://your-backend-domain/api/health
```

Expected response:

```json
{"status":"ok"}
```

## Frontend Deployment

### Vercel

Use these settings:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Set:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```

### Netlify

Use these settings:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`

Set the same `VITE_API_BASE_URL` value as above.

## Suggested Deployment Order

1. Deploy the backend first.
2. Confirm `GET /api/health` works on the live backend URL.
3. Deploy the frontend with `VITE_API_BASE_URL` pointing at the backend.
4. Update backend `FRONTEND_ORIGIN` to the exact frontend production domain.
5. Re-test the frontend and admin login flow.

## Production Checklist

- `FLASK_DEBUG=false`
- `ADMIN_ID` and `ADMIN_PASS` changed from defaults
- `JWT_SECRET` replaced with a strong random value
- `DB_SSL_DISABLED=false` for managed SSL MySQL hosts
- `VITE_API_BASE_URL` includes `/api`
- `FRONTEND_ORIGIN` matches the deployed frontend domain exactly

## Troubleshooting

### CORS errors in the browser

Check:

- `FRONTEND_ORIGIN` matches the frontend URL exactly
- no trailing slash is used
- the frontend is calling the correct backend domain

### Frontend loads but API calls fail

Check:

- `VITE_API_BASE_URL` is set
- it includes `/api`
- the backend health endpoint works directly

### Backend returns database errors

Check:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`
- `DB_SSL_DISABLED` is `false` for Aiven and other SSL-enabled MySQL services
- the database host allows connections from your deployment platform

### Admin login fails in production

Check:

- `ADMIN_ID` and `ADMIN_PASS`
- `JWT_SECRET`
- browser requests are going to the live backend, not localhost

## Example Production Values

Backend:

```env
COUNTRYLAYER_API_KEY=your_countrylayer_key
WORLD_BANK_API_KEY=
IMF_API_KEY=
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=economy_intelligence
DB_SSL_DISABLED=false
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
FLASK_DEBUG=false
FRONTEND_ORIGIN=https://economy-intelligence.vercel.app
ADMIN_ID=your-admin-id
ADMIN_PASS=your-strong-password
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_HOURS=12
```

Frontend:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```
