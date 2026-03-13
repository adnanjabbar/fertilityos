# Feature Prioritization — FertilityOS

## Prioritization Framework

Features are evaluated using the **RICE scoring model**:
- **R**each — How many users does this impact?
- **I**mpact — How much does it improve the user experience?
- **C**onfidence — How confident are we in the estimates?
- **E**ffort — How much work is required?

`RICE Score = (Reach × Impact × Confidence) / Effort`

---

## Core Platform Features

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---|---|---|---|---|---|---|
| Clinic registration | 10/10 | 10/10 | 9/10 | 3 | 300 | P0 |
| Staff sub-accounts | 10/10 | 9/10 | 9/10 | 3 | 270 | P0 |
| RBAC / Permissions | 10/10 | 9/10 | 9/10 | 4 | 202 | P0 |
| Custom subdomain | 8/10 | 7/10 | 8/10 | 3 | 149 | P0 |
| Custom domain (BYO) | 5/10 | 8/10 | 7/10 | 5 | 56 | P2 |

## Module Features

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---|---|---|---|---|---|---|
| Patient registration | 10/10 | 10/10 | 10/10 | 2 | 500 | P0 |
| Appointment scheduling | 10/10 | 10/10 | 10/10 | 4 | 250 | P0 |
| Clinical notes (EMR) | 9/10 | 10/10 | 9/10 | 4 | 202 | P0 |
| IVF cycle tracking | 8/10 | 10/10 | 9/10 | 5 | 144 | P0 |
| Embryo records/grading | 7/10 | 9/10 | 9/10 | 3 | 189 | P1 |
| Invoice generation | 8/10 | 8/10 | 9/10 | 3 | 192 | P1 |
| Appointment reminders | 9/10 | 7/10 | 9/10 | 2 | 283 | P1 |
| Patient portal | 7/10 | 8/10 | 7/10 | 7 | 56 | P2 |
| Telemedicine | 6/10 | 8/10 | 7/10 | 8 | 42 | P2 |
| Inventory management | 5/10 | 6/10 | 8/10 | 4 | 60 | P3 |
| Analytics dashboard | 6/10 | 7/10 | 7/10 | 5 | 59 | P3 |
| Mobile apps | 7/10 | 8/10 | 6/10 | 10 | 34 | P3 |
| HL7 FHIR integration | 4/10 | 9/10 | 6/10 | 8 | 27 | P4 |

---

## Priority Definitions

| Level | Definition |
|---|---|
| **P0** | Must-have for MVP launch. Blocking other features. |
| **P1** | Important for MVP quality. Build in MVP sprint. |
| **P2** | High value post-MVP. Build in Phase 4. |
| **P3** | Medium value. Schedule for Phase 4-5. |
| **P4** | Low urgency. Enterprise / Phase 5. |
