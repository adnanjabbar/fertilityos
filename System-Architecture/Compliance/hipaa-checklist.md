# FertilityOS — HIPAA-Style Compliance Checklist

This document maps FertilityOS security and privacy controls to common HIPAA-style requirements. Use it to understand how the platform supports compliance and to prepare for BAA discussions or audits. **This is not legal advice;** clinics should work with their compliance and legal teams.

---

## 1. Access Control

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Unique user identification** | Each user has a unique identifier; no shared accounts. | Auth.js (NextAuth) with unique user IDs; users sign up/in with email; tenant-scoped sessions. |
| **Role-based access** | Access to PHI and admin functions limited by role. | Roles: `admin`, `staff`, `patient`, `super_admin`. App routes and APIs enforce `tenantId` and role (e.g. Billing, Team, Inventory, Super Dashboard only for admin/super_admin). |
| **Automatic logoff** | Session timeout after inactivity. | Session managed by Auth.js; configurable session maxAge and updateAge. Recommend configuring idle timeout in production. |
| **Encryption for authentication** | Credentials and session tokens protected. | Passwords hashed (e.g. bcrypt via Auth.js adapter); session tokens signed and stored securely (HTTP-only cookies). |

---

## 2. Encryption

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Data in transit** | PHI encrypted when transmitted over the network. | All traffic over HTTPS (TLS). Enforced in production (e.g. DigitalOcean App Platform, custom domain with SSL). |
| **Data at rest** | PHI stored in encrypted form in databases and backups. | Database (PostgreSQL) can be configured with encryption at rest (e.g. provider-level encryption on DigitalOcean Managed Databases). Application does not store PHI in plaintext in logs. |
| **Encryption controls** | Use of standard, strong encryption. | TLS 1.2+ for transit; database and hosting provider handle at-rest encryption. No custom crypto; reliance on platform and industry standards. |

---

## 3. Audit Logs & Activity Tracking

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Audit trail** | Record of who accessed or changed PHI and when. | Foundation for audit logging: tenant-scoped APIs, user and tenantId on every request. Planned: dedicated audit log table and UI for access/modification events (e.g. patient record views, updates, logins). |
| **Log integrity** | Logs cannot be altered without detection. | Planned: append-only or integrity-protected audit store; retention policy. |
| **Log monitoring** | Ability to review logs for suspicious activity. | Planned: admin-facing audit log viewer and export for compliance reviews. |

---

## 4. Business Associate Agreement (BAA)

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **BAA availability** | Covered entities need a BAA with the technology vendor. | FertilityOS as a vendor can enter into BAAs with clinics. BAA process is handled at the business/legal level; the product is designed to support HIPAA-relevant controls (access control, encryption, audit capability). |
| **Subcontractors** | BAAs with subprocessors that handle PHI. | Hosting (e.g. DigitalOcean) and other subprocessors should be under BAAs or equivalent commitments where required; document in your vendor list. |

---

## 5. Risk Assessment & Management

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Risk analysis** | Periodic assessment of risks to PHI (confidentiality, integrity, availability). | Clinics perform their own risk assessment. FertilityOS provides this checklist and architecture docs (e.g. [Infrastructure](../Infrastructure/), [Deployment](../Infrastructure/deployment.md)) to support that process. |
| **Risk management** | Measures to reduce risk to an acceptable level. | Multi-tenant isolation (tenantId on all data), access control, encryption in transit, and planned audit logging support risk mitigation. |
| **Sanction policy** | Consequences for workforce members who violate policies. | Handled at the clinic/organization level; FertilityOS does not define workforce sanctions. |

---

## 6. Minimum Necessary & Use of PHI

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Minimum necessary** | Access to PHI limited to what is needed for the task. | Role-based access and tenant isolation ensure users only see data for their organization and within their role (e.g. staff vs admin). |
| **Use and disclosure** | PHI used only for permitted purposes. | Application is designed for clinical and operational use within the clinic; no use of PHI for marketing or unrelated purposes. |

---

## 7. Integrity & Availability

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Data integrity** | Safeguards to prevent improper alteration or destruction of PHI. | Database constraints, tenant-scoped writes, and (planned) audit logs support integrity. Backups and recovery are via hosting/provider (e.g. managed database backups). |
| **Availability** | PHI available when needed. | Hosting on a reliable platform (e.g. DigitalOcean App Platform, managed DB) with uptime targets; no built-in HA in v1—document provider SLAs. |

---

## 8. Administrative Safeguards

| Requirement | Description | FertilityOS implements |
|-------------|-------------|------------------------|
| **Security management** | Policies and procedures to prevent, detect, and respond to security incidents. | Clinic responsibility; FertilityOS provides technical controls (this checklist, architecture docs) to support those policies. |
| **Workforce security** | Training and clearance for staff who access PHI. | Clinic responsibility. FertilityOS supports access control (roles, invites) so clinics can enforce workforce access. |
| **Incident response** | Response and reporting for security incidents. | Clinic and vendor process; FertilityOS can support with (planned) audit logs and secure access to data for investigation. |

---

## Summary: Implemented vs Planned

- **Implemented:** Access control (unique IDs, RBAC, tenant isolation), encryption in transit (HTTPS), secure authentication (hashed passwords, secure sessions), minimum necessary via roles and tenants, BAA handled at business level, documentation for risk assessment.
- **Planned:** Dedicated audit log storage and UI, log integrity and retention, admin audit viewer/export; explicit session timeout configuration guidance; documentation of at-rest encryption and backup practices.

For the full system context, see [System Architecture](../README.md), [Deployment](../Infrastructure/deployment.md), and [Database setup](../Infrastructure/digitalocean-database-setup.md).
