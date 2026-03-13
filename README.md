# FertilityOS

> **The Operating System for Fertility Care**

FertilityOS is the world's first comprehensive SaaS platform built specifically for fertility clinics and reproductive health centers.

## What is FertilityOS?

FertilityOS is a cloud-native, multi-tenant SaaS platform that enables fertility clinics to manage every aspect of their operations — from patient intake and EMR to IVF laboratory workflows, billing, and telemedicine — under a single, white-label-ready platform.

Built by a **Fertility Specialist**, every workflow and module is designed around real clinical practice.

## Project Structure

```
FertilityOS/
├── website/                    # Next.js landing page (Phase 1)
│   ├── app/
│   │   ├── components/         # Landing page sections
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── package.json
│
└── System-Architecture/        # Development roadmap & documentation
    ├── Idea/                   # Problem discovery, competitor analysis
    ├── Validation/             # Landing page test, waitlist strategy
    ├── Planning/               # Product roadmap, MVP scope, tech stack
    ├── Design/                 # Branding guidelines, design system
    ├── Development/            # Frontend, backend, API docs
    ├── Infrastructure/         # Cloud, DevOps, CI/CD
    └── ...                     # Additional phases
```

## Current Phase

**Phase 1 — Landing Page**

The marketing website is live at `website/`. It validates demand, captures waitlist signups, and establishes the FertilityOS brand.

## Getting Started (Landing Page)

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Modules

| Module | Status |
|---|---|
| Patient Management | Included in core |
| Scheduling & Appointments | Included in core |
| Electronic Medical Records (EMR) | Included in core |
| IVF Lab & Embryology | Included in core |
| Financial Management & Billing | Included in core |
| Staff & Role Management | Included in core |
| Telemedicine | Add-on (Coming Soon) |
| Patient Portal | Add-on (Coming Soon) |
| Donor Management | Add-on (Coming Soon) |
| Inventory Management | Add-on (Coming Soon) |
| Analytics & Reporting | Add-on (Coming Soon) |

## Pricing

| Plan | Monthly | Quarterly | Yearly |
|---|---|---|---|
| Starter | $299/mo | $284/mo | $239/mo |
| Growth | $699/mo | $664/mo | $559/mo |
| Scale | $1,499/mo | $1,424/mo | $1,199/mo |

All plans include a **14-day free trial** — no credit card required.

## Architecture

See [`System-Architecture/README.md`](./System-Architecture/README.md) for the full development roadmap and architecture documentation.

---

*Built for clinicians. Powered by the cloud.*
