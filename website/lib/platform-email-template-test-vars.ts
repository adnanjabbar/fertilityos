/**
 * Build placeholder values for super-admin "send test email" from template content.
 */

const DEMO: Record<string, string> = {
  brandName: "TheFertilityOS",
  name: "Jane Doe",
  patientName: "Jane Doe",
  resetUrl: "https://www.thefertilityos.com/reset-password?token=DEMO_TOKEN",
  verifyUrl: "https://www.thefertilityos.com/verify?token=DEMO_TOKEN",
  magicLinkUrl: "https://www.thefertilityos.com/portal/verify?token=DEMO_TOKEN",
  setPasswordUrl: "https://www.thefertilityos.com/portal/set-password?token=DEMO_TOKEN",
  code: "123456",
  clinicName: "Advanced Fertility Center",
  appointmentType: "Consultation",
  appointmentDate: "Monday, March 16, 2026 at 10:00 AM",
  invoiceNumber: "INV-10042",
  amount: "$199.00",
  detailsUrl: "https://www.thefertilityos.com/portal/appointments",
  expiresMinutes: "15",
  subjectLine: "Your appointment tomorrow",
};

export function extractPlaceholderKeys(...parts: string[]): string[] {
  const keys = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const part of parts) {
    if (!part) continue;
    for (const m of part.matchAll(re)) {
      keys.add(m[1]!);
    }
  }
  return [...keys].sort();
}

export function buildTestVarsForTemplate(subject: string, html: string, text: string | null): Record<string, string> {
  const keys = extractPlaceholderKeys(subject, html, text ?? "");
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k] = DEMO[k] ?? `[${k}]`;
  }
  return out;
}
