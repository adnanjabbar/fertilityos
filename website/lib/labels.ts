/**
 * Label generation for MR-based wrist bands, barcodes, vial/sample labels, medication envelopes.
 * Supports Zebra (ZPL), Brother, generic thermal, and PDF (HTML) output.
 */

export type LabelType =
  | "wrist_band"
  | "ivf_lab_barcode"
  | "vial_label"
  | "sample_bottle"
  | "medication_envelope";

export type PrinterType = "zebra" | "brother" | "thermal" | "pdf";

export type LabelVariant = "with_barcode" | "text_only";

export interface PatientLabelData {
  mrNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  /** Optional: for medication envelope - prescription id or date */
  prescriptionInfo?: string;
  /** Optional: for vial/sample - type (e.g. "Vial", "Petri") */
  sampleType?: string;
}

function formatDob(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return String(d);
  }
}

function fullName(data: PatientLabelData): string {
  return `${data.firstName} ${data.lastName}`.trim();
}

// --- ZPL (Zebra) ---

function zplEscape(s: string): string {
  return s.replace(/[\x00-\x1f^~\\]/g, (c) => `_${c.charCodeAt(0).toString(16)}`);
}

function zplWristBand(data: PatientLabelData, variant: LabelVariant): string {
  const name = fullName(data);
  const dob = formatDob(data.dateOfBirth);
  const mr = data.mrNumber;
  const y = 60;
  let zpl = `^XA^CF0,24^FO40,${y}^FDMR: ${zplEscape(mr)}^FS^FO40,${y + 36}^FD${zplEscape(name)}^FS^FO40,${y + 72}^FDDOB: ${zplEscape(dob)}^FS`;
  if (variant === "with_barcode") {
    zpl += `^FO40,${y + 120}^BY2,2,50^BCN,80,Y,N,N^FD${zplEscape(mr)}^FS`;
  }
  zpl += "^XZ";
  return zpl;
}

function zplIvfLabBarcode(data: PatientLabelData, variant: LabelVariant): string {
  const mr = data.mrNumber;
  const name = fullName(data);
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  let zpl = `^XA^CF0,20^FO20,20^BY2,2,60^BCN,70,Y,N,N^FD${zplEscape(mr)}^FS`;
  zpl += `^FO20,100^FD${zplEscape(mr)}^FS`;
  if (variant === "with_barcode" || 1) {
    zpl += `^FO20,130^FD${zplEscape(name)}^FS^FO20,155^FD${zplEscape(dateStr)}^FS`;
  }
  zpl += "^XZ";
  return zpl;
}

function zplVialOrSample(data: PatientLabelData, sampleType: string): string {
  const mr = data.mrNumber;
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `^XA^CF0,22^FO20,20^FD${zplEscape(sampleType)}^FS^FO20,50^BY2,2,40^BCN,50,Y,N,N^FD${zplEscape(mr)}^FS^FO20,105^FD${zplEscape(mr)}^FS^FO20,130^FD${zplEscape(dateStr)}^FS^XZ`;
}

function zplVialLabel(data: PatientLabelData): string {
  return zplVialOrSample(data, data.sampleType || "Vial");
}

function zplSampleBottle(data: PatientLabelData): string {
  return zplVialOrSample(data, data.sampleType || "Sample");
}

function zplMedicationEnvelope(data: PatientLabelData): string {
  const name = fullName(data);
  const mr = data.mrNumber;
  const presc = data.prescriptionInfo || new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  return `^XA^CF0,24^FO40,40^FDMR: ${zplEscape(mr)}^FS^FO40,75^FD${zplEscape(name)}^FS^FO40,110^FD${zplEscape(presc)}^FS^FO40,150^BY2,2,40^BCN,50,Y,N,N^FD${zplEscape(mr)}^FS^XZ`;
}

// --- PDF / HTML (for large format or standard printer) ---

function pdfWristBand(data: PatientLabelData, variant: LabelVariant): string {
  const name = fullName(data);
  const dob = formatDob(data.dateOfBirth);
  const mr = data.mrNumber;
  let html = `<div class="label wrist-band"><div class="mr">MR: ${escapeHtml(mr)}</div><div class="name">${escapeHtml(name)}</div><div class="dob">DOB: ${escapeHtml(dob)}</div>`;
  if (variant === "with_barcode") {
    html += `<div class="barcode-placeholder" data-content="${escapeHtml(mr)}">|| ${escapeHtml(mr)} ||</div>`;
  }
  html += "</div>";
  return wrapPrintHtml(html);
}

function pdfIvfLabBarcode(data: PatientLabelData): string {
  const name = fullName(data);
  const mr = data.mrNumber;
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  const html = `<div class="label ivf-barcode"><div class="barcode-placeholder" data-content="${escapeHtml(mr)}">|| ${escapeHtml(mr)} ||</div><div class="mr">${escapeHtml(mr)}</div><div class="name">${escapeHtml(name)}</div><div class="date">${escapeHtml(dateStr)}</div></div>`;
  return wrapPrintHtml(html);
}

function pdfVialOrSample(data: PatientLabelData, sampleType: string): string {
  const mr = data.mrNumber;
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  const html = `<div class="label vial"><div class="type">${escapeHtml(sampleType)}</div><div class="barcode-placeholder" data-content="${escapeHtml(mr)}">|| ${escapeHtml(mr)} ||</div><div class="mr">${escapeHtml(mr)}</div><div class="date">${escapeHtml(dateStr)}</div></div>`;
  return wrapPrintHtml(html);
}

function pdfMedicationEnvelope(data: PatientLabelData): string {
  const name = fullName(data);
  const mr = data.mrNumber;
  const presc = data.prescriptionInfo || new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  const html = `<div class="label medication"><div class="mr">MR: ${escapeHtml(mr)}</div><div class="name">${escapeHtml(name)}</div><div class="presc">${escapeHtml(presc)}</div><div class="barcode-placeholder" data-content="${escapeHtml(mr)}">|| ${escapeHtml(mr)} ||</div></div>`;
  return wrapPrintHtml(html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapPrintHtml(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 12px; }
  .label { border: 1px solid #ccc; padding: 16px; margin-bottom: 12px; max-width: 4in; }
  .label .mr, .label .name { font-weight: bold; font-size: 14pt; }
  .label .dob, .label .date, .label .presc { font-size: 12pt; color: #333; }
  .barcode-placeholder { font-family: monospace; letter-spacing: 2px; margin-top: 8px; font-size: 12pt; }
  @media print { body { padding: 0; } .label { break-inside: avoid; } }
  </style></head><body>${content}</body></html>`;
}

// --- Thermal (plain text) ---

function thermalWristBand(data: PatientLabelData): string {
  const name = fullName(data);
  const dob = formatDob(data.dateOfBirth);
  return `MR: ${data.mrNumber}\n${name}\nDOB: ${dob}`;
}

function thermalIvfLabBarcode(data: PatientLabelData): string {
  const name = fullName(data);
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  return `${data.mrNumber}\n${name}\n${dateStr}`;
}

function thermalVialOrSample(data: PatientLabelData, sampleType: string): string {
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  return `${sampleType}\n${data.mrNumber}\n${dateStr}`;
}

function thermalMedicationEnvelope(data: PatientLabelData): string {
  const name = fullName(data);
  const presc = data.prescriptionInfo || new Date().toLocaleDateString(undefined, { dateStyle: "short" });
  return `MR: ${data.mrNumber}\n${name}\n${presc}`;
}

// --- Public API ---

export interface GenerateLabelResult {
  contentType: "text/plain" | "text/html" | "application/zpl";
  body: string;
  filename?: string;
}

export function generateLabel(
  labelType: LabelType,
  printerType: PrinterType,
  data: PatientLabelData,
  variant: LabelVariant = "with_barcode"
): GenerateLabelResult {
  const ext = printerType === "zebra" || printerType === "brother" ? "zpl" : printerType === "pdf" ? "html" : "txt";
  const filename = `label-${labelType}-${data.mrNumber}.${ext}`;

  if (printerType === "zebra" || printerType === "brother") {
    let zpl: string;
    switch (labelType) {
      case "wrist_band":
        zpl = zplWristBand(data, variant);
        break;
      case "ivf_lab_barcode":
        zpl = zplIvfLabBarcode(data, variant);
        break;
      case "vial_label":
        zpl = zplVialLabel(data);
        break;
      case "sample_bottle":
        zpl = zplSampleBottle(data);
        break;
      case "medication_envelope":
        zpl = zplMedicationEnvelope(data);
        break;
      default: {
        const _: never = labelType;
        zpl = zplWristBand(data, variant);
      }
    }
    return { contentType: "application/zpl", body: zpl, filename };
  }

  if (printerType === "pdf") {
    let html: string;
    switch (labelType) {
      case "wrist_band":
        html = pdfWristBand(data, variant);
        break;
      case "ivf_lab_barcode":
        html = pdfIvfLabBarcode(data);
        break;
      case "vial_label":
        html = pdfVialOrSample(data, data.sampleType || "Vial");
        break;
      case "sample_bottle":
        html = pdfVialOrSample(data, data.sampleType || "Sample");
        break;
      case "medication_envelope":
        html = pdfMedicationEnvelope(data);
        break;
      default: {
        const _: never = labelType;
        html = pdfWristBand(data, variant);
      }
    }
    return { contentType: "text/html", body: html, filename };
  }

  // thermal
  let text: string;
  switch (labelType) {
    case "wrist_band":
      text = thermalWristBand(data);
      break;
    case "ivf_lab_barcode":
      text = thermalIvfLabBarcode(data);
      break;
    case "vial_label":
      text = thermalVialOrSample(data, data.sampleType || "Vial");
      break;
    case "sample_bottle":
      text = thermalVialOrSample(data, data.sampleType || "Sample");
      break;
    case "medication_envelope":
      text = thermalMedicationEnvelope(data);
      break;
    default: {
      const _: never = labelType;
      text = thermalWristBand(data);
    }
  }
  return { contentType: "text/plain", body: text, filename };
}
