# FertilityOS Architecture Overview

## Environment
- Ubuntu VPS
- Nginx serving static frontend
- Node.js backend running on port 3000
- PM2 process manager
- Reverse proxy: `/api` → `localhost:3000`

## Frontend
Location: `/var/www/ivf-platform/public`
- Static HTML, CSS, JS pages
- Uses `fetch()` to call `/api/*` endpoints
- Main entry points: `login.html`, `dashboard.html`

## Backend
Running on port 3000 and managed via PM2.

### Core layers
- **HTTP layer**: Express app + middleware (`helmet`, `cors`, rate limiting, request logger)
- **Routing layer**: Modular route files under `src/routes`
- **Controller layer**: Domain logic under `src/controllers`
- **Data layer**: PostgreSQL pool via `src/config/database.js`

### Route groups
- Public/auth: `/api/auth`, `/api/subscription`, `/api/email`, `/api/subscription-payment`
- Tenant-scoped: `/api/patients`, `/api/cycles`, `/api/embryos`, `/api/lab`, `/api/medical-history`, `/api/medications`, `/api/treatments`, `/api/documents`, `/api/finance`, `/api/billing`, `/api/receipts`, `/api/clinic`, `/api/countries`, `/api/users`, `/api/payments`
- System probes: `/api/system/health/live`, `/api/system/health/ready`

## Nginx
- Serves static files from `/public`
- Proxies `/api` to backend

## Authentication Flow
1. Browser calls `/api/auth/login`
2. Nginx proxies to `localhost:3000/auth/login`
3. Backend returns JWT
4. Frontend stores token in `localStorage`

## Health & Reliability
- **Liveness endpoint**: `/api/system/health/live`
  - Returns service-level heartbeat
- **Readiness endpoint**: `/api/system/health/ready`
  - Verifies DB connectivity with timeout guard
  - Returns `503` when dependencies are unavailable
- Legacy `/health` now redirects to liveness endpoint for compatibility

## Production Hardening Roadmap
1. Add OpenTelemetry traces + request correlation IDs
2. Add centralized structured logging sink (ELK/Loki)
3. Add Redis-backed distributed rate limiting
4. Add background job runner (BullMQ) for email, billing, reminders
5. Add cache layer for reference data and heavy dashboard queries
6. Add blue/green deployment with automated smoke checks
7. Add API contract tests and load tests in CI

## Product Roadmap
- Multi-clinic support
- Role-based access control
- IVF modules
- Billing
- Lab management
- Enterprise SaaS model
