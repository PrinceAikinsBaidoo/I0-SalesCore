# Deployment runbook — I0 SalesCore

## Prerequisites

- Java 17 and Maven (local backend), or Docker + Docker Compose
- Node 20+ (local frontend)
- PostgreSQL 16+

## Configuration

### Backend

Environment variables (see `backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Use `prod` for production behaviour |
| `DATASOURCE_URL` | JDBC URL |
| `DATASOURCE_USERNAME` / `DATASOURCE_PASSWORD` | Database credentials (local `application.yml` still defaults password for this repo’s dev DB unless you override) |
| `APP_JWT_SECRET` | JWT signing secret (long random string, 32+ characters) |
| `APP_BOOTSTRAP_TOKEN` | Optional secret for first-admin bootstrap (see `MVP_CHECKLIST.md`) |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated browser origins |
| `APP_PAYSTACK_SECRET_KEY` | Required for backend Paystack verification of CARD/MOBILE_MONEY payments |
| `APP_PAYSTACK_VERIFICATION_ENABLED` | Keep `true` in production (set `false` only for local/offline testing) |
| `APP_PAYSTACK_EXPECTED_CURRENCY` | Expected Paystack transaction currency (default `GHS`) |

### Frontend

- Default API base is `/api/v1` (Vite dev proxy and Docker nginx both forward `/api` to the backend).
- For a separate API host, set `VITE_API_BASE_URL` (see `frontend/.env.example`).

## Docker Compose (recommended for MVP)

1. Copy `.env.example` to `.env` in the `io-salescore` folder and set at least `POSTGRES_PASSWORD` and `APP_JWT_SECRET`.

2. From `io-salescore`:

   ```bash
   docker compose up --build
   ```

3. Open the UI at `http://localhost` (port 80) and API health at `http://localhost:8080/actuator/health` if you expose the API port.

The `web` service proxies `/api/*` to the `api` service, so the browser uses same-origin `/api/v1`.

## Local development (without Docker)

1. Create database `io_salescore` in PostgreSQL.

2. Backend:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   Set `DATASOURCE_*` and optionally `APP_JWT_SECRET` if you do not want the dev default in `application.yml`.

3. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   For local work, do **not** set `VITE_API_BASE_URL` to your deployed Render URL in `.env` or `.env.local`. If you do, the browser still calls Render (cold starts, high latency) even though the UI is on `localhost`. Omit the variable so requests use `/api/v1` and the Vite proxy to `localhost:8080`.

   **Also check:** Vite prefers **shell / Windows user** `VITE_API_BASE_URL` over `.env` files. Run `Get-ChildItem Env:VITE_API_BASE_URL` in PowerShell and remove it from *System Properties → Environment Variables* if it is set. For `npm run dev`, `vite.config.js` clears that process variable before loading `.env*`, so the app defaults to `/api/v1` and the proxy; you can still set `VITE_API_BASE_URL` in a `.env` / `.env.development.local` file if you intentionally want a remote API while developing.

## Health check

- `GET /actuator/health` — no authentication (use for load balancers / uptime checks).

## First login (seeded database)

Flyway seed (`V2__seed_data.sql`) creates:

- Username: `admin`
- Password: `Admin@123`

Change this password immediately in production (Users / Settings as applicable).

## Optional first-admin bootstrap

If **no** `ADMIN` user exists and `APP_BOOTSTRAP_TOKEN` is set, you can call:

`POST /api/v1/auth/bootstrap`

with JSON body:

```json
{
  "token": "<same as APP_BOOTSTRAP_TOKEN>",
  "username": "owner",
  "email": "owner@example.com",
  "password": "SecurePassPhrase!",
  "fullName": "Store Owner",
  "phone": "+233000000000"
}
```

With the default seed migration, an admin already exists, so this endpoint returns conflict until that user is removed (not typical). Prefer changing the seeded password for MVP.
