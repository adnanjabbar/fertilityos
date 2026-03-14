/**
 * Static HIPAA-style compliance checklist for the in-app Compliance page.
 * Mirrors System-Architecture/Compliance/hipaa-checklist.md.
 * No database; read-only for admins.
 */

export type ComplianceStatus = "implemented" | "planned" | "n_a";

export type ComplianceItem = {
  id: string;
  title: string;
  description: string;
  fertilityOsImplements: string;
  status: ComplianceStatus;
};

export type ComplianceSection = {
  id: string;
  title: string;
  items: ComplianceItem[];
};

export const COMPLIANCE_CHECKLIST: ComplianceSection[] = [
  {
    id: "access-control",
    title: "Access Control",
    items: [
      {
        id: "unique-user-id",
        title: "Unique user identification",
        description: "Each user has a unique identifier; no shared accounts.",
        fertilityOsImplements:
          "Auth.js (NextAuth) with unique user IDs; users sign up/in with email; tenant-scoped sessions.",
        status: "implemented",
      },
      {
        id: "rbac",
        title: "Role-based access",
        description: "Access to PHI and admin functions limited by role.",
        fertilityOsImplements:
          "Roles: admin, staff, patient, super_admin. App routes and APIs enforce tenantId and role (Billing, Team, Inventory, Super Dashboard for admin/super_admin).",
        status: "implemented",
      },
      {
        id: "automatic-logoff",
        title: "Automatic logoff",
        description: "Session timeout after inactivity.",
        fertilityOsImplements:
          "Session managed by Auth.js; configurable session maxAge and updateAge. Recommend configuring idle timeout in production.",
        status: "implemented",
      },
      {
        id: "auth-encryption",
        title: "Encryption for authentication",
        description: "Credentials and session tokens protected.",
        fertilityOsImplements:
          "Passwords hashed (e.g. bcrypt via Auth.js adapter); session tokens signed and stored securely (HTTP-only cookies).",
        status: "implemented",
      },
    ],
  },
  {
    id: "encryption",
    title: "Encryption",
    items: [
      {
        id: "data-in-transit",
        title: "Data in transit",
        description: "PHI encrypted when transmitted over the network.",
        fertilityOsImplements:
          "All traffic over HTTPS (TLS). Enforced in production (e.g. DigitalOcean App Platform, custom domain with SSL).",
        status: "implemented",
      },
      {
        id: "data-at-rest",
        title: "Data at rest",
        description: "PHI stored in encrypted form in databases and backups.",
        fertilityOsImplements:
          "Database (PostgreSQL) can be configured with encryption at rest (e.g. provider-level encryption on DigitalOcean Managed Databases).",
        status: "implemented",
      },
      {
        id: "encryption-controls",
        title: "Encryption controls",
        description: "Use of standard, strong encryption.",
        fertilityOsImplements:
          "TLS 1.2+ for transit; database and hosting provider handle at-rest encryption.",
        status: "implemented",
      },
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Logs & Activity Tracking",
    items: [
      {
        id: "audit-trail",
        title: "Audit trail",
        description: "Record of who accessed or changed PHI and when.",
        fertilityOsImplements:
          "Foundation: tenant-scoped APIs, user and tenantId on every request. Planned: dedicated audit log table and UI for access/modification events.",
        status: "planned",
      },
      {
        id: "log-integrity",
        title: "Log integrity",
        description: "Logs cannot be altered without detection.",
        fertilityOsImplements: "Planned: append-only or integrity-protected audit store; retention policy.",
        status: "planned",
      },
      {
        id: "log-monitoring",
        title: "Log monitoring",
        description: "Ability to review logs for suspicious activity.",
        fertilityOsImplements: "Planned: admin-facing audit log viewer and export for compliance reviews.",
        status: "planned",
      },
    ],
  },
  {
    id: "baa",
    title: "Business Associate Agreement (BAA)",
    items: [
      {
        id: "baa-availability",
        title: "BAA availability",
        description: "Covered entities need a BAA with the technology vendor.",
        fertilityOsImplements:
          "FertilityOS as a vendor can enter into BAAs with clinics. BAA process is handled at the business/legal level.",
        status: "implemented",
      },
      {
        id: "subcontractors",
        title: "Subcontractors",
        description: "BAAs with subprocessors that handle PHI.",
        fertilityOsImplements:
          "Hosting (e.g. DigitalOcean) and other subprocessors should be under BAAs or equivalent; document in vendor list.",
        status: "n_a",
      },
    ],
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment & Management",
    items: [
      {
        id: "risk-analysis",
        title: "Risk analysis",
        description: "Periodic assessment of risks to PHI.",
        fertilityOsImplements:
          "Clinics perform their own risk assessment. FertilityOS provides this checklist and architecture docs to support that process.",
        status: "implemented",
      },
      {
        id: "risk-management",
        title: "Risk management",
        description: "Measures to reduce risk to an acceptable level.",
        fertilityOsImplements:
          "Multi-tenant isolation, access control, encryption in transit, and planned audit logging support risk mitigation.",
        status: "implemented",
      },
      {
        id: "sanction-policy",
        title: "Sanction policy",
        description: "Consequences for workforce members who violate policies.",
        fertilityOsImplements: "Handled at the clinic/organization level; FertilityOS does not define workforce sanctions.",
        status: "n_a",
      },
    ],
  },
  {
    id: "minimum-necessary",
    title: "Minimum Necessary & Use of PHI",
    items: [
      {
        id: "minimum-necessary",
        title: "Minimum necessary",
        description: "Access to PHI limited to what is needed for the task.",
        fertilityOsImplements:
          "Role-based access and tenant isolation ensure users only see data for their organization and within their role.",
        status: "implemented",
      },
      {
        id: "use-disclosure",
        title: "Use and disclosure",
        description: "PHI used only for permitted purposes.",
        fertilityOsImplements:
          "Application designed for clinical and operational use within the clinic; no use of PHI for marketing or unrelated purposes.",
        status: "implemented",
      },
    ],
  },
  {
    id: "integrity-availability",
    title: "Integrity & Availability",
    items: [
      {
        id: "data-integrity",
        title: "Data integrity",
        description: "Safeguards to prevent improper alteration or destruction of PHI.",
        fertilityOsImplements:
          "Database constraints, tenant-scoped writes, and (planned) audit logs support integrity. Backups via hosting provider.",
        status: "implemented",
      },
      {
        id: "availability",
        title: "Availability",
        description: "PHI available when needed.",
        fertilityOsImplements:
          "Hosting on a reliable platform (e.g. DigitalOcean App Platform, managed DB) with uptime targets.",
        status: "implemented",
      },
    ],
  },
  {
    id: "administrative",
    title: "Administrative Safeguards",
    items: [
      {
        id: "security-management",
        title: "Security management",
        description: "Policies and procedures to prevent, detect, and respond to security incidents.",
        fertilityOsImplements: "Clinic responsibility; FertilityOS provides technical controls and this checklist to support those policies.",
        status: "n_a",
      },
      {
        id: "workforce-security",
        title: "Workforce security",
        description: "Training and clearance for staff who access PHI.",
        fertilityOsImplements: "Clinic responsibility. FertilityOS supports access control (roles, invites) so clinics can enforce workforce access.",
        status: "n_a",
      },
      {
        id: "incident-response",
        title: "Incident response",
        description: "Response and reporting for security incidents.",
        fertilityOsImplements: "Clinic and vendor process; FertilityOS can support with (planned) audit logs and secure access for investigation.",
        status: "planned",
      },
    ],
  },
];
