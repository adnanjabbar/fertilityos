# FertilityOS Architecture Overview

## Runtime Topology
- Ubuntu VPS host with Nginx as entry point.
- Static frontend is served by Nginx from `/public`.
- Node.js/Express backend runs on `PORT` (default `3000`) behind Nginx reverse proxy (`/api -> localhost:3000`).
- PM2 supervises process lifecycle in production.

## Backend Design (Current)
- **API framework:** Express with modular route/controller organization under `src/routes` and `src/controllers`.
- **Core middlewares:**
  - Helmet security headers.
  - Configurable CORS policy (`CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_ALL_ORIGINS`).
  - API-wide rate limiting.
  - Structured request logging with request IDs.
  - Centralized error handling with production-safe responses.
- **Database:** PostgreSQL via `pg` pool (`src/config/database.js`).
- **Health endpoint:** `/health` reports uptime and optional database health.

## Multi-Tenant Strategy
- Tenant resolution middleware maps inbound host subdomain -> clinic record.
- Tenant-scoped endpoints mount under `/api/*` after tenant resolution.
- Clinic status and subscription checks gate access.

## API Surface (high-level)
- Public/auth scope: `/api/auth`, `/api/subscription`, `/api/email`, `/api/subscription-payment`.
- Tenant scope: patients, cycles, embryos, lab, medical history, medications, treatments, documents, finance, billing, receipts, clinic, countries, users, payments.

## Operational Hardening Added
- Runtime config centralization (`src/config/runtime.js`) for environment-driven behavior.
- Graceful shutdown for PM2/container restarts:
  - closes HTTP server,
  - drains DB pool,
  - exits with timeout safeguard.
- Consistent `X-Request-Id` response headers for tracing.

## Recommended Next Evolution (Roadmap)

### 1) Domain-Driven Module Boundaries
- Split into bounded contexts:
  - Identity & Access (auth, roles, permissions)
  - Clinical (patients, cycles, embryos, lab)
  - Financial (billing, receipts, payments, subscriptions)
  - Platform (tenant provisioning, audit, notifications)
- Introduce service-layer abstractions for cross-module orchestration.

### 2) Security & Compliance
- Add strict JWT rotation + refresh token flows.
- Add audit trail tables for PHI-sensitive operations.
- Encrypt sensitive columns at rest.
- Add configurable CSP and HSTS policy for production.

### 3) Reliability & Scalability
- Move long-running workflows to background jobs (email dispatch, report generation).
- Introduce Redis for rate limiting/session/cache hotspots.
- Add read replicas when reporting load grows.

### 4) Observability
- Emit JSON logs to centralized logging backend.
- Add metrics (`/metrics`) and distributed tracing.
- Define SLOs for API latency/error rate and alerting policies.

### 5) Product Expansion
- Enterprise RBAC + feature flags per subscription tier.
- Multi-clinic parent organization hierarchy.
- Billing automation + payment reconciliation pipeline.
- Internationalization and locale-specific workflows.
