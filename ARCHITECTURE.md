# FertilityOS Architecture Overview

## Runtime Topology
- **Edge:** Nginx terminates TLS and serves the SPA from `/public`.
- **API:** Node.js + Express service running on `0.0.0.0:${PORT}` (default `3000`) behind Nginx reverse proxy (`/api -> localhost:3000`).
- **Process Manager:** PM2 supervises the API process for restart policies and zero-downtime reloads.
- **Database:** PostgreSQL accessed through a shared `pg.Pool` connection manager.

## Request Flow
1. Browser requests static assets from Nginx.
2. SPA calls `fetch('/api/...')`.
3. Nginx proxies request to Express.
4. Express middleware stack applies:
   - request context (`x-request-id` propagation)
   - JSON structured request logging
   - security headers (`helmet`)
   - CORS policy
   - payload parsing
   - API rate limiting
5. Route handlers perform auth, tenant resolution, and business logic.
6. PostgreSQL queries execute via pooled DB client.
7. Response returns through Nginx to client.

## API Health and Reliability
- `GET /health` and `GET /health/liveness` provide process liveness (uptime + timestamp).
- `GET /health/readiness` verifies database availability (`SELECT 1`) and returns `503` when not ready.
- Graceful shutdown is enabled for `SIGTERM`/`SIGINT` to close the HTTP server cleanly before exit.

## Security Baseline
- JWT-based authentication.
- Helmet hardening for baseline HTTP protections.
- API rate limiting (`500 requests / 15 min / client`).
- Request IDs included in response headers and error payloads for traceability.

## Multi-Tenant Foundation
- Tenant middleware resolves clinic context for all tenant-scoped routes under `/api/*`.
- Domain modules currently include:
  - Patients, cycles, embryos, lab, medical history, medications, treatments
  - Billing, receipts, payments, subscriptions
  - Clinic overview/configuration and user management

## Observability
- Every request emits structured JSON logs including:
  - timestamp, method, URL, status code, latency, IP, user agent, request ID
- Errors are centrally handled and logged with request correlation metadata.

## Suggested Next Evolution
1. **Strict tenant isolation** at the DB layer (RLS or schema-per-tenant).
2. **Background workers** for email, billing reconciliation, and report generation.
3. **OpenAPI spec** and generated SDKs for frontend/mobile clients.
4. **Distributed tracing** (OpenTelemetry + Jaeger/Tempo).
5. **SLO-driven operations** with dashboards + alerting (latency/error saturation).
6. **Feature flags** for phased rollout of advanced IVF/lab modules.
