# Tech Stack — FertilityOS

## Guiding Principles

1. **Cloud-native & scalable** — Horizontal scaling from day one.
2. **Multi-tenant by design** — Tenant isolation at the data layer.
3. **Compliance-ready** — Architecture that supports HIPAA, GDPR, and regional healthcare regulations.
4. **Developer productivity** — Strongly typed, well-documented, and maintainable.
5. **Cost-efficient** — Managed services where possible to reduce operational overhead.

---

## Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/SSG for SEO, excellent DX, React ecosystem |
| Language | TypeScript | Type safety, better IDE support, fewer runtime errors |
| Styling | Tailwind CSS | Utility-first, rapid UI development, design token support |
| UI Components | shadcn/ui | Accessible, customizable, Tailwind-compatible |
| State Management | Zustand | Lightweight, simple, TypeScript-friendly |
| Forms | React Hook Form + Zod | Performant, schema-validated forms |
| Data Fetching | TanStack Query | Caching, background sync, optimistic updates |
| Charts | Recharts | Lightweight, composable, Tailwind-compatible |
| Calendar | FullCalendar | Feature-rich scheduling UI |

---

## Backend

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js (Bun) | Fast startup, native TypeScript, compatible npm ecosystem |
| Framework | Hono or Fastify | Lightweight, typed, high-performance REST/RPC |
| API Style | REST + tRPC | Type-safe client-server contracts for internal services |
| Auth | Clerk or Auth.js | Managed multi-tenant auth, RBAC, SSO ready |
| ORM | Drizzle ORM | Type-safe, lightweight, SQL-first |
| Queue | BullMQ (Redis) | Job scheduling, background tasks |
| Email | Resend | Transactional email, developer-friendly API |
| SMS | Twilio | Appointment reminders, 2FA |
| File Storage | Cloudflare R2 / AWS S3 | Medical document and image storage |

---

## Database

| Layer | Technology | Rationale |
|---|---|---|
| Primary DB | PostgreSQL (Neon / Supabase) | Relational, ACID, mature, multi-tenant schemas |
| Tenant Isolation | Schema-per-tenant or row-level security | Compliance requirement |
| Cache | Redis (Upstash) | Session cache, queue backend, rate limiting |
| Search | Meilisearch | Fast, typo-tolerant patient/record search |

---

## Infrastructure

| Layer | Technology | Rationale |
|---|---|---|
| Cloud | AWS or Vercel (hybrid) | Landing page on Vercel, backend on AWS ECS/Fargate |
| Container | Docker + Docker Compose | Local dev and production parity |
| Orchestration | AWS ECS Fargate (or Kubernetes later) | Serverless containers, auto-scaling |
| CDN | Cloudflare | Global edge, DDoS protection, domain proxy |
| DNS | Cloudflare DNS | White-label subdomain management |
| SSL | Let's Encrypt via Cloudflare | Automatic TLS for custom domains |
| Secrets | AWS Secrets Manager | Secure credential storage |

---

## DevOps & CI/CD

| Layer | Technology |
|---|---|
| Version Control | GitHub |
| CI/CD | GitHub Actions |
| Code Quality | ESLint, Prettier, TypeScript strict mode |
| Testing | Vitest (unit), Playwright (e2e) |
| Monitoring | Sentry (errors), Datadog (APM) |
| Logging | Pino (structured JSON logs) |
| Uptime | Better Uptime |

---

## Third-Party Integrations (Planned)

| Integration | Purpose |
|---|---|
| Stripe | Subscription billing and module payments |
| Twilio | SMS notifications |
| Zoom / Daily.co | Telemedicine video |
| HL7 FHIR API | Healthcare data interoperability |
| QuickBooks / Xero | Accounting sync |
| Google Calendar | Calendar integration |

---

## White-Label Domain Architecture

```
Patient/Clinic accesses: https://clinic-name.com (their own domain)
                         ↓  (Cloudflare DNS CNAME / A-record)
                    https://clinic-name.fertilityo.com
                         ↓  (Next.js middleware tenant resolution)
                    FertilityOS Cloud (tenant: clinic-name)
```

Custom domain customers add a CNAME record pointing to `proxy.fertilityo.com`. The reverse proxy resolves the tenant and routes requests to their isolated backend/data.
