"use client";

import { useRef } from "react";
import Link from "next/link";

type LineItem = {
  id: string;
  medicationId: string | null;
  medicationGroupId: string | null;
  quantity: string;
  durationDays: number | null;
  frequency: string | null;
  instructionsOverride: string | null;
  medication: {
    brandName: string;
    genericName: string;
    dosage: string;
    form: string;
  } | null;
  groupName: string | null;
  groupItems: Array<{
    brandName: string;
    genericName: string;
    dosage: string;
    form: string;
    quantityPerCycle: string | null;
    defaultDurationDays: number | null;
  }> | null;
};

type Props = {
  prescription: {
    id: string;
    patientId: string;
    prescriptionNumber: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    prescribedByName: string;
    createdAt: Date;
    lines: LineItem[];
  };
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
  };
  branding: {
    logoUrl: string | null;
    letterheadImageUrl: string | null;
    footerAddress: string | null;
    footerPhone: string | null;
    footerEmail: string | null;
    footerWebsite: string | null;
    footerText: string | null;
    marginTopMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
    marginRightMm: number;
  };
  verifyUrl: string;
  qrDataUrl: string;
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PrintPrescriptionView({
  prescription,
  patient,
  branding,
  qrDataUrl,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const marginStyle = {
    marginTop: `${branding.marginTopMm}mm`,
    marginBottom: `${branding.marginBottomMm}mm`,
    marginLeft: `${branding.marginLeftMm}mm`,
    marginRight: `${branding.marginRightMm}mm`,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Non-print: back and print buttons */}
      <div className="print:hidden fixed top-4 right-4 z-10 flex gap-2">
        <Link
          href={`/app/patients/${prescription.patientId}`}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 min-h-[44px] inline-flex items-center"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 min-h-[44px]"
        >
          Print
        </button>
      </div>

      <div
        ref={printRef}
        className="max-w-none p-0"
        style={{ padding: `${branding.marginTopMm}mm ${branding.marginRightMm}mm ${branding.marginBottomMm}mm ${branding.marginLeftMm}mm` }}
      >
        {branding.letterheadImageUrl && (
          <div className="mb-4">
            <img
              src={branding.letterheadImageUrl}
              alt="Letterhead"
              className="max-h-24 w-auto object-contain"
            />
          </div>
        )}
        {branding.logoUrl && !branding.letterheadImageUrl && (
          <div className="mb-4">
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="max-h-16 w-auto object-contain"
            />
          </div>
        )}

        <div className="space-y-4 text-slate-900">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-bold">Prescription</h1>
              {prescription.prescriptionNumber && (
                <p className="text-sm text-slate-600">
                  No. {prescription.prescriptionNumber}
                </p>
              )}
            </div>
            {qrDataUrl && (
              <div className="flex-shrink-0" aria-hidden>
                <img
                  src={qrDataUrl}
                  alt=""
                  width={140}
                  height={140}
                  className="w-[140px] h-[140px]"
                />
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Scan to view in patient portal
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-slate-500">Patient:</span>{" "}
              {patient.firstName} {patient.lastName}
            </div>
            <div>
              <span className="font-medium text-slate-500">DOB:</span>{" "}
              {formatDate(patient.dateOfBirth)}
            </div>
            <div>
              <span className="font-medium text-slate-500">Prescribed by:</span>{" "}
              {prescription.prescribedByName}
            </div>
            <div>
              <span className="font-medium text-slate-500">Date:</span>{" "}
              {formatDate(prescription.createdAt)}
            </div>
            {prescription.startDate && (
              <div>
                <span className="font-medium text-slate-500">Start:</span>{" "}
                {formatDate(prescription.startDate)}
              </div>
            )}
            {prescription.endDate && (
              <div>
                <span className="font-medium text-slate-500">End:</span>{" "}
                {formatDate(prescription.endDate)}
              </div>
            )}
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-700">
                  Medication
                </th>
                <th className="text-left py-2 font-semibold text-slate-700">
                  Dosage
                </th>
                <th className="text-left py-2 font-semibold text-slate-700">
                  Qty
                </th>
                <th className="text-left py-2 font-semibold text-slate-700">
                  Frequency
                </th>
                <th className="text-left py-2 font-semibold text-slate-700">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {prescription.lines.map((line) => {
                if (line.medication) {
                  return (
                    <tr key={line.id} className="border-b border-slate-100">
                      <td className="py-2">
                        {line.medication.brandName} ({line.medication.genericName})
                      </td>
                      <td className="py-2">{line.medication.dosage}</td>
                      <td className="py-2">{line.quantity}</td>
                      <td className="py-2">{line.frequency ?? "—"}</td>
                      <td className="py-2">
                        {line.durationDays != null
                          ? `${line.durationDays} days`
                          : "—"}
                      </td>
                    </tr>
                  );
                }
                if (line.groupName && line.groupItems && line.groupItems.length > 0) {
                  return (
                    <Fragment key={line.id}>
                      <tr>
                        <td colSpan={5} className="py-1 pt-2 font-medium text-slate-700">
                          {line.groupName}
                        </td>
                      </tr>
                      {line.groupItems.map((item, i) => (
                        <tr key={`${line.id}-${i}`} className="border-b border-slate-100">
                          <td className="py-1 pl-4">
                            {item.brandName} ({item.genericName})
                          </td>
                          <td className="py-1">{item.dosage}</td>
                          <td className="py-1">{item.quantityPerCycle ?? line.quantity}</td>
                          <td className="py-1">{line.frequency ?? "—"}</td>
                          <td className="py-1">
                            {line.durationDays != null
                              ? `${line.durationDays} days`
                              : item.defaultDurationDays != null
                                ? `${item.defaultDurationDays} days`
                                : "—"}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                }
                return null;
              })}
            </tbody>
          </table>

          {prescription.lines.some((l) => l.instructionsOverride) && (
            <div className="pt-2">
              <p className="font-medium text-slate-700 mb-1">Instructions</p>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {prescription.lines
                  .filter((l) => l.instructionsOverride)
                  .map((l) => (
                    <li key={l.id}>{l.instructionsOverride}</li>
                  ))}
              </ul>
            </div>
          )}

          {prescription.notes && (
            <div className="pt-2">
              <p className="font-medium text-slate-700 mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{prescription.notes}</p>
            </div>
          )}
        </div>

        <footer
          className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-0.5"
          style={{ marginTop: "2rem" }}
        >
          {branding.footerAddress && <p>{branding.footerAddress}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-0">
            {branding.footerPhone && <span>{branding.footerPhone}</span>}
            {branding.footerEmail && <span>{branding.footerEmail}</span>}
            {branding.footerWebsite && (
              <a
                href={branding.footerWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {branding.footerWebsite}
              </a>
            )}
          </div>
          {branding.footerText && <p className="mt-1">{branding.footerText}</p>}
        </footer>
      </div>
    </div>
  );
}

function Fragment({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
