# FertilityOS Architecture Overview

## 1) Platform Topology
- **Edge**: Nginx handles TLS termination, static asset delivery, and reverse proxying for API traffic.
- **Application**: Node.js + Express API process managed by PM2 (`src/server.js`).
- **Data**: PostgreSQL accessed through a pooled client (`src/config/database.js`).
- **Clients**: Browser SPA pages in `public/` calling `/api/*` endpoints.

## 2) Runtime Request Flow
1. Browser requests are served directly by Nginx from static files.
2. API requests (`/api/*`) are reverse proxied to the Node.js app on port `3000`.
3. Express middleware applies:
   - request logging + request ID correlation,
   - security headers (`helmet`),
   - CORS policy,
   - JSON/urlencoded payload parsing,
   - API rate limiting.
4. Auth/public routes run first (`/api/auth`, subscription, email, payments).
5. Tenant middleware resolves clinic/organization context for tenant-scoped routes.
6. Controllers execute business logic and query PostgreSQL.
7. Centralized error middleware returns consistent API error responses.

## 3) Availability & Operations
- **Liveness**: `GET /health/live`
  - confirms process uptime and API metadata.
- **Readiness**: `GET /health/ready`
  - verifies database dependency via `SELECT 1`.
- **Legacy compatibility**: `GET /health` permanently redirects to `/health/live`.
- **Graceful shutdown**:
  - on `SIGINT` / `SIGTERM`, HTTP listener is closed first,
  - then PostgreSQL pool is drained before process exit.

## 4) Security Baseline
- Helmet headers enabled (with CSP/embedder policy explicitly disabled for current frontend compatibility).
- Rate limiting applied to `/api/*`.
- Tenant isolation middleware applied before protected domain routes.
- JWT authentication/permissions enforced in route middleware where required.

## 5) Observability
- Structured JSON logs include:
  - timestamp,
  - `x-request-id` correlation ID,
  - method + URL,
  - status code,
  - duration in milliseconds,
  - user agent.
- Error responses include `requestId` to simplify troubleshooting across client logs and server logs.

## 6) Current Domain Modules
- Authentication & user management
- Patients, cycles, embryos
- Lab workflows + test management
- Medical history, medications, treatments
- Documents
- Finance, billing, payments, receipts
- Clinic overview & organization settings
- Subscription and subscription payment flows

## 7) Recommended Next Upgrades (High-Impact)
1. **Production CORS allowlist** (replace wildcard origin).
2. **Central config schema validation** for all env vars (JWT, SMTP, Stripe, DB).
3. **API versioning** (`/api/v1`) for long-term backward compatibility.
4. **Background workers + queue** for email, billing jobs, and heavy report generation.
5. **Audit trail tables** for clinical and billing mutations.
6. **OpenAPI spec + contract tests** to stabilize frontend/backend integration.
7. **Metrics endpoint** (Prometheus) + dashboards (latency, error rate, DB pool saturation).
