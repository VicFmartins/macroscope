# MacroScope

MacroScope is a global economic intelligence platform that collects public macro data, computes a country score, and exposes rankings, comparison views, and AI-generated insights through a modular monolith architecture.

## Live URLs

- Frontend: https://macroscope-silk.vercel.app
- Backend: https://backend-production-4d6f.up.railway.app

## Product Scope

- Collect macroeconomic indicators from public APIs
- Score countries on a 0-100 scale
- Expose ranking, snapshot, comparison, metadata, and insight endpoints
- Serve a resilient Next.js dashboard with live API integration and mock fallback

## Architecture

```text
frontend (Next.js on Vercel)
        |
        v
country-service (Spring Boot REST API)
        |
        +--> data-collector
        +--> scoring-engine
        +--> insight-engine
        |
        +--> PostgreSQL
        +--> Redis
        +--> Gemini API
```

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind, Framer Motion
- Backend: Java 21, Spring Boot 3.3, Maven multi-module
- Data: PostgreSQL, Redis, Flyway
- AI: Gemini API
- Monitoring: Sentry-ready integration for frontend and backend
- Delivery: GitHub Actions, Vercel, Railway

## Core API

- `GET /ranking`
- `GET /country/{code}`
- `GET /compare?c1=BRA&c2=USA`
- `GET /metadata/countries`
- `GET /insights?country=BRA`
- `POST /collect/trigger`

Swagger UI:

- `http://localhost:8080/swagger-ui.html`
- `https://backend-production-4d6f.up.railway.app/swagger-ui.html`

## Local Development

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start infrastructure and backend:

   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres redis backend
   ```

3. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open:

   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8080`

## Environment Variables

Important backend variables:

- `APP_ENV`
- `DATABASE_URL`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_URL`
- `GEMINI_API_KEY`
- `COLLECTION_TRIGGER_API_KEY`
- `ALLOWED_ORIGINS`
- `SENTRY_DSN`

Important frontend variables:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SENTRY_DSN`

Production validation is built in:

- frontend build fails when `NEXT_PUBLIC_API_BASE_URL` is missing in production mode
- backend startup fails in production when critical runtime variables still point to localhost or when `COLLECTION_TRIGGER_API_KEY` is missing

## Security

- `POST /collect/trigger` is protected with `X-API-Key`
- request rate limiting is enabled in the backend
- health details are reduced in production
- frontend emits security headers and removes the `X-Powered-By` header

## Monitoring

Sentry is wired into both runtime layers.

Set these variables to activate it:

- Backend: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`
- Frontend: `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

## CI/CD

GitHub Actions workflow:

- builds and tests backend on every push to `main`
- validates frontend environment
- builds frontend on every push to `main`
- deploys backend to Railway after CI succeeds
- deploys frontend to Vercel after backend deployment succeeds

Required GitHub secrets:

- `RAILWAY_API_TOKEN`
- `VERCEL_TOKEN`

Required GitHub Actions variables:

- `RAILWAY_PROJECT_ID`
- `RAILWAY_SERVICE_ID`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Custom Domain Preparation

The project is prepared for:

- `https://app.macroscope` for the frontend
- `https://api.macroscope` for the backend

To switch to custom domains:

1. attach the domain in Vercel and Railway
2. update `NEXT_PUBLIC_SITE_URL`
3. update `NEXT_PUBLIC_API_BASE_URL`
4. update backend `ALLOWED_ORIGINS`

## Deployment Notes

- Railway uses `backend/railway.toml`
- Vercel uses `frontend/vercel.json`
- Flyway runs automatically on backend startup
- Redis is used for insight caching and runtime resilience
