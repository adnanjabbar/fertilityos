# FertilityOS — System Architecture

> **World's First SaaS Platform for Fertility Clinics & Fertility Centers Management**

This folder is the single source of truth for the FertilityOS development roadmap, architecture decisions, design system, and operational strategy. Every sub-folder maps directly to a phase or domain of the product lifecycle.

---

## Architecture Overview

```
FertilityOS (SaaS)
├── Idea                  — Problem discovery, market research, niche selection
├── Validation            — Customer interviews, landing page tests, pre-sales
├── Planning              — Roadmap, MVP scope, tech stack, dev plan
├── Design                — Wireframes, UI/UX, prototype, design system
├── Development           — Frontend, backend, APIs, database, auth, integrations
├── Infrastructure        — Cloud hosting, DevOps, CI/CD, monitoring, security
├── Testing               — Unit, integration, performance, beta testing
├── Launch                — Landing page, Product Hunt, beta users, public release
├── Acquisition           — SEO, content marketing, social media, cold email
├── Distribution          — Directories, SaaS marketplaces, partnerships
├── Conversion            — Sales funnel, free trial, freemium, pricing
├── Revenue               — Subscriptions, upsells, add-ons, enterprise
├── Analytics             — User tracking, funnel/cohort analysis, KPIs, A/B
├── Retention             — Onboarding, email automation, churn reduction
├── Growth                — Referral programs, PLG, viral loops, expansion
└── Scaling               — Automation, hiring, systems, global expansion
```

---

## Current Phase

**Phase 1 — Launch → Landing Page**

The immediate priority is the public-facing marketing website at `website/`. This validates demand, captures waitlist signups, and establishes brand identity.

---

## Key Documents

| Document | Path | Description |
|---|---|---|
| Product Roadmap | `Planning/product-roadmap.md` | Phased delivery plan |
| Tech Stack | `Planning/tech-stack.md` | Chosen technologies and rationale |
| MVP Scope | `Planning/mvp-scope.md` | Minimum viable product definition |
| Pricing Strategy | `Planning/pricing-strategy.md` | Affordable positioning, core vs add-on modules, API monetization |
| Branding Guidelines | `Design/branding-guidelines.md` | Colors, fonts, logo usage |
| Design System | `Design/design-system.md` | Component library and patterns |
| Website Design Source | `Design/website-design-source.md` | Canonical UI/UX from `website/` for all product UI |
| Old-System Reference | `Old-System/README.md` | Summary of pre-architecture implementation (reference only) |
| Skills Registry | `Skills/skills.md` | Global skills and FertilityOS conventions for agents |
| Deployment | `Infrastructure/deployment.md` | DigitalOcean App Platform, domain (thefertilityos.com), Next.js port 3000 |
| Database setup (DO) | `Infrastructure/digitalocean-database-setup.md` | Create/attach PostgreSQL 18, run migrations, set DATABASE_URL and auth env |
| HIPAA-style compliance checklist | `Compliance/hipaa-checklist.md` | Access control, encryption, audit logs, BAA, risk assessment—mapping for clinics |

---

## How to Use This Folder

- Each sub-folder contains `.md` files relevant to that phase.
- Files are updated as decisions are made and work progresses.
- Reference these docs when building, designing, or planning new features.
