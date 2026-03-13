# MVP Scope — FertilityOS

## Definition of MVP

The Minimum Viable Product for FertilityOS is a multi-tenant SaaS platform that allows a fertility clinic to:

1. **Register** their clinic and create an admin account
2. **Onboard staff** with role-based access
3. **Manage patients** — registration, demographics, medical history
4. **Schedule appointments** — calendar-based booking with reminders
5. **Record clinical notes** — basic EMR (SOAP notes, diagnoses)
6. **Track IVF cycles** — stimulation, egg retrieval, fertilization, embryo records
7. **Generate invoices** — basic billing for treatments

This scope is intentionally constrained to validate core workflows and gather feedback before expanding to advanced modules.

---

## In Scope (MVP)

| Feature | Priority | Module |
|---|---|---|
| Clinic registration & admin account | P0 | Core |
| Staff sub-accounts (Doctors, Nurses, etc.) | P0 | Core |
| Role-based access control (RBAC) | P0 | Core |
| Custom subdomain (`clinic.fertilityo.com`) | P0 | Core |
| Patient registration | P0 | Patient Management |
| Patient demographics & medical history | P0 | Patient Management |
| Appointment scheduling | P0 | Scheduling |
| Automated appointment reminders (email) | P1 | Scheduling |
| Clinical notes (SOAP format) | P0 | EMR |
| IVF cycle tracking | P0 | IVF Lab |
| Embryo records and grading | P1 | IVF Lab |
| Invoice generation | P1 | Billing |
| Subscription management (Stripe) | P0 | Billing |
| Module add-on purchasing | P1 | Billing |

---

## Out of Scope (MVP — Post-MVP Modules)

| Feature | Target Phase |
|---|---|
| Telemedicine (video) | Phase 4 |
| Patient-facing portal | Phase 4 |
| Mobile apps | Phase 5 |
| Inventory management | Phase 4 |
| Insurance claims | Phase 4 |
| Custom domain (BYO domain) | Phase 3 |
| Multi-language support | Phase 5 |
| HL7 FHIR integration | Phase 5 |
| Donor management | Phase 4 |
| Surrogacy management | Phase 4 |
| Advanced analytics dashboard | Phase 4 |

---

## User Roles (MVP)

| Role | Permissions |
|---|---|
| **Admin** | Full access to all enabled modules, user management, billing |
| **Doctor / Fertility Specialist** | Patient records, appointments, clinical notes, IVF cycles |
| **Embryologist** | IVF lab module, embryo records |
| **Nurse** | Patient records (read/write), appointments, basic notes |
| **Lab Technician** | IVF lab module (limited), lab results |
| **Reception** | Appointments, patient registration, invoices |
| **Radiologist** | Upload/view imaging reports |
| **Staff** | Custom — admin-defined permissions |

---

## Success Criteria for MVP

- [ ] At least 3 fertility clinics successfully onboarded
- [ ] Full IVF cycle recorded end-to-end for at least 10 patients
- [ ] Zero critical data loss or security incidents
- [ ] < 2 second page load times on average
- [ ] Net Promoter Score (NPS) ≥ 40 from beta users

---

## Development Timeline (Estimated)

| Phase | Duration | Deliverable |
|---|---|---|
| Phase 1 — Landing Page | 1 week | Public website live |
| Phase 2 — Account Creation | 3 weeks | Clinic registration, staff accounts, RBAC |
| Phase 3 — Core Modules | 8 weeks | Patient, Scheduling, EMR, IVF Lab, Billing |
| Beta Testing | 2 weeks | 3 clinic pilots |
| Phase 3 Launch | 1 week | Public availability of MVP |

**Total estimated time to MVP launch: ~15 weeks**
