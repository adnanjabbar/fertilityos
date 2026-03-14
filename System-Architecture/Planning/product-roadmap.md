# Product Roadmap — FertilityOS

## Vision

FertilityOS is a cloud-native, multi-tenant SaaS platform that enables fertility clinics and reproductive health centers to manage every aspect of their operations — from patient intake and EMR to IVF laboratory workflows, billing, and telemedicine — under a single, white-label-ready platform.

---

## Phases

### Phase 1 — Foundation & Brand (Current)

**Goal:** Establish brand presence, validate demand, and capture early adopters.

- [x] Repository setup and architecture documentation
- [x] Marketing landing page (Next.js + Tailwind CSS)
- [ ] Waitlist / early access sign-up form
- [ ] Branding guidelines and design system
- [ ] Domain setup and deployment pipeline

**Milestone:** 100 waitlist signups before proceeding to Phase 2.

---

### Phase 2 — Account Creation & Multi-Tenancy

**Goal:** Allow clinics to register, configure their instance, and onboard their team.

- [ ] Clinic registration flow (name, address, specialty, license)
- [ ] Custom domain or FertilityOS subdomain option (`clinic.fertilityo.com` or BYO domain)
- [ ] Domain masking / reverse-proxy setup for white-label deployments
- [ ] Admin account creation with role-based access control (RBAC)
- [ ] Sub-account creation: Doctor, Nurse, Embryologist, Lab Tech, Reception, Radiologist, Fertility Specialist, Staff
- [ ] Module permissions — admin assigns what each role can access
- [ ] Email verification and 2FA

---

### Phase 3 — Core Modules (MVP)

**Goal:** Deliver the essential clinical modules for day-to-day fertility clinic operations.

**Status:** Core modules implemented. See `next-steps-development.md` for polish (reminders, Stripe) and Phase 4.

#### 3.1 Patient Management ✅
- [x] Patient registration, demographic data
- [ ] Medical history and consents (basic notes in place)
- [ ] Partner / donor linkage

#### 3.2 Appointments & Scheduling ✅
- [x] Calendar-based booking
- [x] Multi-provider scheduling (providerId on appointment)
- [ ] Automated reminders (SMS/Email) — next step

#### 3.3 Electronic Medical Records (EMR) ✅
- [x] Clinical notes, SOAP format
- [ ] Diagnosis codes (ICD-10) — optional field in place
- [ ] Prescription and medication tracking

#### 3.4 IVF Laboratory & Embryology Module ✅
- [x] IVF cycle tracking
- [x] Egg retrieval / fertilization (cycle status)
- [x] Embryo grading and cryopreservation (embryo records)
- [ ] PGT/PGS results logging

#### 3.5 Financial Management & Billing ✅
- [x] Invoice generation and line items
- [ ] Stripe subscription management — next step
- [ ] Insurance claims (where applicable)
- [x] Payment tracking (paid status, paidAt)

---

### Phase 4 — Advanced Modules

- [ ] Telemedicine (video consultations)
- [ ] Patient Portal (patient-facing app)
- [ ] Inventory & Consumables Management
- [ ] Reporting & Analytics Dashboard
- [ ] Donor Management Module
- [ ] Surrogacy Case Management
- [ ] Lab Integration (LIS/LIMS connectors)

---

### Phase 5 — Growth & Scale

- [ ] API marketplace for third-party integrations
- [ ] Mobile apps (iOS/Android) for staff and patients
- [ ] Multi-language and multi-currency support
- [ ] Regional compliance packs (HIPAA, GDPR, HL7 FHIR)
- [ ] Referral and affiliate program
- [ ] Enterprise / white-label licensing tier

---

## Pricing Model

| Tier | Billing | Core Platform | Modules |
|---|---|---|---|
| Starter | Monthly | ✅ | Per-module add-on |
| Growth | Quarterly | ✅ | Per-module add-on (5% discount) |
| Scale | Yearly | ✅ | Per-module add-on (20% discount) |
| Enterprise | Custom | ✅ | All modules bundled |

Individual modules can be enabled per-account by purchasing the module add-on in the billing dashboard.

---

## Success Metrics

| Metric | Phase 1 Target | Phase 2 Target | Year 1 Target |
|---|---|---|---|
| Waitlist signups | 100 | — | — |
| Paying accounts | — | 10 | 100 |
| MRR | — | $5,000 | $50,000 |
| Clinics onboarded | — | 10 | 100 |
| Churn rate | — | < 5% | < 3% |
