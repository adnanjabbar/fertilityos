"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, X, FileText, Plus, FlaskConical, Stethoscope, Trash2, Pill, Printer } from "lucide-react";

type Patient = {
  id: string;
  mrNumber: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gender: string | null;
  notes: string | null;
  nationalIdType: string | null;
  nationalIdValue: string | null;
  createdAt: string;
  updatedAt: string;
};

function VerifyPhoneButton({
  patientId,
  phone,
  onVerified,
}: {
  patientId: string;
  phone: string;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"idle" | "sent" | "verifying">("idle");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim().replace(/\s/g, ""),
          context: "patient_verify",
          patientId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }
      setStep("sent");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim().replace(/\s/g, ""),
          code: code.trim(),
          context: "patient_verify",
          patientId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }
      setStep("idle");
      setCode("");
      onVerified();
    } finally {
      setLoading(false);
    }
  };

  if (step === "sent") {
    return (
      <form onSubmit={handleVerify} className="inline-flex items-center gap-2 flex-wrap">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-24 px-2 py-1 rounded border border-slate-200 text-sm"
        />
        <button type="submit" disabled={loading} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Verifying…" : "Verify"}
        </button>
        <button type="button" onClick={() => { setStep("idle"); setCode(""); setError(null); }} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Verify phone"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}

type ClinicalNote = {
  id: string;
  authorName: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosisCode: string | null;
  createdAt: string;
  updatedAt: string;
};

type IvfCycle = {
  id: string;
  patientId: string;
  cycleNumber: string;
  cycleType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Embryo = {
  id: string;
  cycleId: string;
  day: string | null;
  grade: string | null;
  status: string;
  disposition?: string | null;
  source?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Opu = {
  id: string;
  cycleId: string;
  retrievalDate: string | null;
  oocytesTotal: number | null;
  oocytesMature: number | null;
  oocytesImmature: number | null;
  oocytesMii: number | null;
  oocytesGv: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type FertilizationEvent = {
  id: string;
  cycleId: string;
  opuId: string | null;
  fertilizationType: string;
  oocytesInseminated: number | null;
  oocytesFertilized: number | null;
  zygotesNormal: number | null;
  zygotesAbnormal: number | null;
  performedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Transfer = {
  id: string;
  cycleId: string;
  patientId: string;
  transferDate: string;
  transferType: string;
  numberEmbryosTransferred: number | null;
  numberImplanted: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  embryoIds?: string[];
};

type CryoStraw = {
  id: string;
  cycleId: string;
  embryoId: string;
  strawLabel: string | null;
  storageLocation: string | null;
  frozenAt: string;
  thawedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Icd11Entity = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  parentCode: string | null;
  chapterCode: string | null;
  chapterTitle: string | null;
  sectionCode: string | null;
  sectionTitle: string | null;
};

type PatientDiagnosis = {
  id: string;
  icd11Code: string | null;
  customDiagnosis: string | null;
  recordedAt: string;
  recordedByName: string | null;
  icd11: {
    code: string;
    title: string;
    description: string | null;
    chapterCode: string | null;
    chapterTitle: string | null;
    sectionCode: string | null;
    sectionTitle: string | null;
  } | null;
};

type GeneticResult = {
  id: string;
  embryoId: string;
  testType: string;
  result: string;
  resultDate: string;
  labReference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PrescriptionLine = {
  id: string;
  medicationId: string | null;
  medicationGroupId: string | null;
  quantity: string;
  durationDays: number | null;
  frequency: string | null;
  instructionsOverride: string | null;
  medication?: { brandName: string; genericName: string; dosage: string; form: string } | null;
  groupName?: string | null;
  groupItems?: Array<{ brandName: string; genericName: string; dosage: string; form: string; quantityPerCycle: string | null; defaultDurationDays: number | null }> | null;
};

type Prescription = {
  id: string;
  patientId: string;
  prescribedById: string;
  prescribedByName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PrescriptionLine[];
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function PatientDetailClient({
  patientId,
  canAddCustomDiagnosis = false,
}: {
  patientId: string;
  canAddCustomDiagnosis?: boolean;
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({});
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [addNoteLoading, setAddNoteLoading] = useState(false);
  const [addNoteError, setAddNoteError] = useState<string | null>(null);
  const [addNoteForm, setAddNoteForm] = useState({ subjective: "", objective: "", assessment: "", plan: "", diagnosisCode: "" });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm] = useState<Partial<ClinicalNote>>({});
  const [saveNoteLoading, setSaveNoteLoading] = useState(false);
  const [cycles, setCycles] = useState<IvfCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [addCycleLoading, setAddCycleLoading] = useState(false);
  const [addCycleForm, setAddCycleForm] = useState({ cycleNumber: "", cycleType: "fresh", startDate: "", endDate: "", notes: "" });
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [cycleEmbryos, setCycleEmbryos] = useState<Record<string, Embryo[]>>({});
  const [cycleOpu, setCycleOpu] = useState<Record<string, Opu[]>>({});
  const [cycleFertilization, setCycleFertilization] = useState<Record<string, FertilizationEvent[]>>({});
  const [showAddOpu, setShowAddOpu] = useState<string | null>(null);
  const [addOpuForm, setAddOpuForm] = useState({ retrievalDate: "", oocytesTotal: "", oocytesMature: "", oocytesImmature: "", oocytesMii: "", oocytesGv: "", notes: "" });
  const [addOpuLoading, setAddOpuLoading] = useState(false);
  const [showAddFertilization, setShowAddFertilization] = useState<string | null>(null);
  const [addFertForm, setAddFertForm] = useState({ fertilizationType: "icsi", oocytesInseminated: "", oocytesFertilized: "", zygotesNormal: "", zygotesAbnormal: "", performedAt: "", notes: "" });
  const [addFertLoading, setAddFertLoading] = useState(false);
  const [editingOpuId, setEditingOpuId] = useState<string | null>(null);
  const [editOpuForm, setEditOpuForm] = useState<Partial<Opu>>({});
  const [saveOpuLoading, setSaveOpuLoading] = useState(false);
  const [editingFertId, setEditingFertId] = useState<string | null>(null);
  const [editFertForm, setEditFertForm] = useState<Partial<FertilizationEvent>>({});
  const [saveFertLoading, setSaveFertLoading] = useState(false);
  const [showAddEmbryo, setShowAddEmbryo] = useState<string | null>(null);
  const [addEmbryoForm, setAddEmbryoForm] = useState({ day: "", grade: "", status: "fresh", notes: "" });
  const [addEmbryoLoading, setAddEmbryoLoading] = useState(false);
  const [cycleTransfers, setCycleTransfers] = useState<Record<string, Transfer[]>>({});
  const [showAddTransfer, setShowAddTransfer] = useState<string | null>(null);
  const [addTransferForm, setAddTransferForm] = useState({ transferDate: "", transferType: "fresh" as "fresh" | "frozen", numberEmbryosTransferred: "", numberImplanted: "", notes: "", embryoIds: [] as string[] });
  const [addTransferLoading, setAddTransferLoading] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const [editTransferForm, setEditTransferForm] = useState<Partial<Transfer> & { embryoIds?: string[] }>({});
  const [saveTransferLoading, setSaveTransferLoading] = useState(false);
  const [cycleCryo, setCycleCryo] = useState<Record<string, CryoStraw[]>>({});
  const [showAddCryo, setShowAddCryo] = useState<string | null>(null);
  const [addCryoForm, setAddCryoForm] = useState({ embryoId: "", strawLabel: "", storageLocation: "", frozenAt: "", notes: "" });
  const [addCryoLoading, setAddCryoLoading] = useState(false);
  const [recordingThawStrawId, setRecordingThawStrawId] = useState<string | null>(null);
  const [expandedEmbryoId, setExpandedEmbryoId] = useState<string | null>(null);
  const [embryoGeneticResults, setEmbryoGeneticResults] = useState<Record<string, GeneticResult[]>>({});
  const [showAddGeneticResult, setShowAddGeneticResult] = useState<string | null>(null);
  const [addGeneticResultForm, setAddGeneticResultForm] = useState({
    testType: "PGT-A",
    result: "euploid",
    resultDate: "",
    labReference: "",
    notes: "",
  });
  const [addGeneticResultLoading, setAddGeneticResultLoading] = useState(false);
  const [editingGeneticResultId, setEditingGeneticResultId] = useState<string | null>(null);
  const [editGeneticResultForm, setEditGeneticResultForm] = useState<Partial<GeneticResult>>({});
  const [saveGeneticResultLoading, setSaveGeneticResultLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<PatientDiagnosis[]>([]);
  const [diagnosesLoading, setDiagnosesLoading] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState<"icd11" | "custom" | null>(null);
  const [icd11Query, setIcd11Query] = useState("");
  const [icd11Results, setIcd11Results] = useState<Icd11Entity[]>([]);
  const [icd11Searching, setIcd11Searching] = useState(false);
  const [selectedIcd11, setSelectedIcd11] = useState<Icd11Entity | null>(null);
  const [customDiagnosisText, setCustomDiagnosisText] = useState("");
  const [addDiagnosisLoading, setAddDiagnosisLoading] = useState(false);
  const [addDiagnosisError, setAddDiagnosisError] = useState<string | null>(null);
  const [expandedDiagnosisId, setExpandedDiagnosisId] = useState<string | null>(null);
  const [deleteDiagnosisLoading, setDeleteDiagnosisLoading] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [addPrescriptionMode, setAddPrescriptionMode] = useState<"formulary" | "protocol">("formulary");
  const [formularyMedications, setFormularyMedications] = useState<Array<{ id: string; brandName: string; genericName: string; dosage: string; form: string }>>([]);
  const [protocolGroups, setProtocolGroups] = useState<Array<{ id: string; name: string; description: string | null }>>([]);
  const [addPrescriptionForm, setAddPrescriptionForm] = useState({
    startDate: "",
    endDate: "",
    notes: "",
    medicationIds: [] as string[],
    medicationGroupId: "",
    quantity: "1",
    durationDays: "",
    frequency: "",
    instructionsOverride: "",
  });
  const [addPrescriptionLoading, setAddPrescriptionLoading] = useState(false);
  const [addPrescriptionError, setAddPrescriptionError] = useState<string | null>(null);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [printLabelType, setPrintLabelType] = useState<
    "wrist_band" | "ivf_lab_barcode" | "vial_label" | "sample_bottle" | "medication_envelope"
  >("wrist_band");
  const [printPrinterType, setPrintPrinterType] = useState<"zebra" | "brother" | "thermal" | "pdf">("pdf");
  const [printLoading, setPrintLoading] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/app/patients/${patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setPatient(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          postalCode: data.postalCode ?? "",
          gender: data.gender ?? "",
          notes: data.notes ?? "",
          nationalIdType: data.nationalIdType ?? "",
          nationalIdValue: data.nationalIdValue ?? "",
        });
      })
      .catch(() => setError("Patient not found"))
      .finally(() => setLoading(false));
  }, [patientId]);

  const fetchPatient = useCallback(() => {
    fetch(`/api/app/patients/${patientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPatient(data));
  }, [patientId]);

  const fetchNotes = useCallback(() => {
    setNotesLoading(true);
    fetch(`/api/app/patients/${patientId}/notes`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotes)
      .finally(() => setNotesLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchNotes();
  }, [patientId, fetchNotes]);

  const fetchDiagnoses = useCallback(() => {
    setDiagnosesLoading(true);
    fetch(`/api/app/patients/${patientId}/diagnoses`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setDiagnoses)
      .finally(() => setDiagnosesLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchDiagnoses();
  }, [patientId, fetchDiagnoses]);

  useEffect(() => {
    if (icd11Query.trim().length < 2) {
      setIcd11Results([]);
      setIcd11Searching(false);
      return;
    }
    setIcd11Searching(true);
    const t = setTimeout(() => {
      fetch(`/api/app/icd11?q=${encodeURIComponent(icd11Query.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .then(setIcd11Results)
        .finally(() => setIcd11Searching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [icd11Query]);

  const handleAddDiagnosisIcd11 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIcd11) return;
    setAddDiagnosisError(null);
    setAddDiagnosisLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/diagnoses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icd11Code: selectedIcd11.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddDiagnosisError(data.error || "Failed to add diagnosis");
        return;
      }
      setShowAddDiagnosis(null);
      setSelectedIcd11(null);
      setIcd11Query("");
      setIcd11Results([]);
      fetchDiagnoses();
    } finally {
      setAddDiagnosisLoading(false);
    }
  };

  const handleAddDiagnosisCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDiagnosisText.trim()) return;
    setAddDiagnosisError(null);
    setAddDiagnosisLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/diagnoses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDiagnosis: customDiagnosisText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddDiagnosisError(data.error || "Failed to add diagnosis");
        return;
      }
      setShowAddDiagnosis(null);
      setCustomDiagnosisText("");
      fetchDiagnoses();
    } finally {
      setAddDiagnosisLoading(false);
    }
  };

  const handleDeleteDiagnosis = async (diagnosisId: string) => {
    setDeleteDiagnosisLoading(diagnosisId);
    try {
      const res = await fetch(
        `/api/app/patients/${patientId}/diagnoses/${diagnosisId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setExpandedDiagnosisId((id) => (id === diagnosisId ? null : id));
        fetchDiagnoses();
      }
    } finally {
      setDeleteDiagnosisLoading(null);
    }
  };

  const fetchCycles = useCallback(() => {
    setCyclesLoading(true);
    fetch(`/api/app/patients/${patientId}/cycles`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCycles)
      .finally(() => setCyclesLoading(false));
  }, [patientId]);

  const fetchPrescriptions = useCallback(() => {
    setPrescriptionsLoading(true);
    fetch(`/api/app/patients/${patientId}/prescriptions`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setPrescriptions)
      .finally(() => setPrescriptionsLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchCycles();
  }, [patientId, fetchCycles]);

  useEffect(() => {
    if (patientId) fetchPrescriptions();
  }, [patientId, fetchPrescriptions]);

  const fetchEmbryos = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/embryos`);
    if (res.ok) {
      const list = await res.json();
      setCycleEmbryos((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  const fetchOpu = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/opu`);
    if (res.ok) {
      const list = await res.json();
      setCycleOpu((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  const fetchFertilization = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/fertilization`);
    if (res.ok) {
      const list = await res.json();
      setCycleFertilization((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  const fetchTransfers = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/transfers`);
    if (res.ok) {
      const list = await res.json();
      setCycleTransfers((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  const fetchCryo = useCallback(async (cycleId: string) => {
    const res = await fetch(`/api/app/ivf-cycles/${cycleId}/cryo`);
    if (res.ok) {
      const list = await res.json();
      setCycleCryo((prev) => ({ ...prev, [cycleId]: list }));
    }
  }, []);

  useEffect(() => {
    if (expandedCycleId) {
      fetchEmbryos(expandedCycleId);
      fetchOpu(expandedCycleId);
      fetchFertilization(expandedCycleId);
      fetchTransfers(expandedCycleId);
      fetchCryo(expandedCycleId);
    }
  }, [expandedCycleId, fetchEmbryos, fetchOpu, fetchFertilization, fetchTransfers, fetchCryo]);

  const fetchGeneticResults = useCallback(async (embryoId: string) => {
    const res = await fetch(`/api/app/embryos/${embryoId}/genetic-results`);
    if (res.ok) {
      const list = await res.json();
      setEmbryoGeneticResults((prev) => ({ ...prev, [embryoId]: list }));
    }
  }, []);

  useEffect(() => {
    if (expandedEmbryoId) fetchGeneticResults(expandedEmbryoId);
  }, [expandedEmbryoId, fetchGeneticResults]);

  const handleAddGeneticResult = async (embryoId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!addGeneticResultForm.resultDate.trim()) return;
    setAddGeneticResultLoading(true);
    try {
      const res = await fetch(`/api/app/embryos/${embryoId}/genetic-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: addGeneticResultForm.testType,
          result: addGeneticResultForm.result,
          resultDate: addGeneticResultForm.resultDate.trim(),
          labReference: addGeneticResultForm.labReference?.trim() || null,
          notes: addGeneticResultForm.notes?.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add genetic result");
        return;
      }
      setAddNoteError(null);
      setShowAddGeneticResult(null);
      setAddGeneticResultForm({ testType: "PGT-A", result: "euploid", resultDate: "", labReference: "", notes: "" });
      await fetchGeneticResults(embryoId);
    } finally {
      setAddGeneticResultLoading(false);
    }
  };

  const handleSaveGeneticResult = async (embryoId: string, resultId: string) => {
    const body: Record<string, unknown> = {};
    if (editGeneticResultForm.testType !== undefined) body.testType = editGeneticResultForm.testType;
    if (editGeneticResultForm.result !== undefined) body.result = editGeneticResultForm.result;
    if (editGeneticResultForm.resultDate !== undefined) body.resultDate = editGeneticResultForm.resultDate;
    if (editGeneticResultForm.labReference !== undefined) body.labReference = editGeneticResultForm.labReference ?? null;
    if (editGeneticResultForm.notes !== undefined) body.notes = editGeneticResultForm.notes ?? null;
    if (Object.keys(body).length === 0) return;
    setSaveGeneticResultLoading(true);
    try {
      const res = await fetch(`/api/app/embryos/${embryoId}/genetic-results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setAddNoteError("Failed to update genetic result");
        return;
      }
      setAddNoteError(null);
      setEditingGeneticResultId(null);
      setEditGeneticResultForm({});
      await fetchGeneticResults(embryoId);
    } finally {
      setSaveGeneticResultLoading(false);
    }
  };

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCycleForm.cycleNumber.trim()) return;
    setAddCycleLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleNumber: addCycleForm.cycleNumber.trim(),
          cycleType: addCycleForm.cycleType,
          startDate: addCycleForm.startDate || null,
          endDate: addCycleForm.endDate || null,
          notes: addCycleForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add cycle");
        return;
      }
      setShowAddCycle(false);
      setAddCycleForm({ cycleNumber: "", cycleType: "fresh", startDate: "", endDate: "", notes: "" });
      fetchCycles();
    } finally {
      setAddCycleLoading(false);
    }
  };

  const handleAddEmbryo = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    setAddEmbryoLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/embryos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: addEmbryoForm.day.trim() || undefined,
          grade: addEmbryoForm.grade.trim() || undefined,
          status: addEmbryoForm.status,
          notes: addEmbryoForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add embryo");
        return;
      }
      setShowAddEmbryo(null);
      setAddEmbryoForm({ day: "", grade: "", status: "fresh", notes: "" });
      fetchEmbryos(cycleId);
    } finally {
      setAddEmbryoLoading(false);
    }
  };

  const handleAddOpu = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    setAddOpuLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/opu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retrievalDate: addOpuForm.retrievalDate || null,
          oocytesTotal: addOpuForm.oocytesTotal !== "" ? parseInt(addOpuForm.oocytesTotal, 10) : null,
          oocytesMature: addOpuForm.oocytesMature !== "" ? parseInt(addOpuForm.oocytesMature, 10) : null,
          oocytesImmature: addOpuForm.oocytesImmature !== "" ? parseInt(addOpuForm.oocytesImmature, 10) : null,
          oocytesMii: addOpuForm.oocytesMii !== "" ? parseInt(addOpuForm.oocytesMii, 10) : null,
          oocytesGv: addOpuForm.oocytesGv !== "" ? parseInt(addOpuForm.oocytesGv, 10) : null,
          notes: addOpuForm.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add OPU");
        return;
      }
      setShowAddOpu(null);
      setAddOpuForm({ retrievalDate: "", oocytesTotal: "", oocytesMature: "", oocytesImmature: "", oocytesMii: "", oocytesGv: "", notes: "" });
      fetchOpu(cycleId);
    } finally {
      setAddOpuLoading(false);
    }
  };

  const handleSaveOpu = async (cycleId: string, opuId: string) => {
    setSaveOpuLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/opu/${opuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retrievalDate: editOpuForm.retrievalDate ?? undefined,
          oocytesTotal: editOpuForm.oocytesTotal,
          oocytesMature: editOpuForm.oocytesMature,
          oocytesImmature: editOpuForm.oocytesImmature,
          oocytesMii: editOpuForm.oocytesMii,
          oocytesGv: editOpuForm.oocytesGv,
          notes: editOpuForm.notes ?? undefined,
        }),
      });
      if (!res.ok) return;
      setEditingOpuId(null);
      setEditOpuForm({});
      fetchOpu(cycleId);
    } finally {
      setSaveOpuLoading(false);
    }
  };

  const handleAddFertilization = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    setAddFertLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/fertilization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fertilizationType: addFertForm.fertilizationType,
          oocytesInseminated: addFertForm.oocytesInseminated !== "" ? parseInt(addFertForm.oocytesInseminated, 10) : null,
          oocytesFertilized: addFertForm.oocytesFertilized !== "" ? parseInt(addFertForm.oocytesFertilized, 10) : null,
          zygotesNormal: addFertForm.zygotesNormal !== "" ? parseInt(addFertForm.zygotesNormal, 10) : null,
          zygotesAbnormal: addFertForm.zygotesAbnormal !== "" ? parseInt(addFertForm.zygotesAbnormal, 10) : null,
          performedAt: addFertForm.performedAt || null,
          notes: addFertForm.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add fertilization");
        return;
      }
      setShowAddFertilization(null);
      setAddFertForm({ fertilizationType: "icsi", oocytesInseminated: "", oocytesFertilized: "", zygotesNormal: "", zygotesAbnormal: "", performedAt: "", notes: "" });
      fetchFertilization(cycleId);
    } finally {
      setAddFertLoading(false);
    }
  };

  const handleSaveFertilization = async (cycleId: string, eventId: string) => {
    setSaveFertLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/fertilization/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fertilizationType: editFertForm.fertilizationType,
          oocytesInseminated: editFertForm.oocytesInseminated,
          oocytesFertilized: editFertForm.oocytesFertilized,
          zygotesNormal: editFertForm.zygotesNormal,
          zygotesAbnormal: editFertForm.zygotesAbnormal,
          performedAt: editFertForm.performedAt ?? undefined,
          notes: editFertForm.notes ?? undefined,
        }),
      });
      if (!res.ok) return;
      setEditingFertId(null);
      setEditFertForm({});
      fetchFertilization(cycleId);
    } finally {
      setSaveFertLoading(false);
    }
  };

  const handleAddTransfer = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!addTransferForm.transferDate.trim()) return;
    setAddTransferLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferDate: addTransferForm.transferDate,
          transferType: addTransferForm.transferType,
          numberEmbryosTransferred: addTransferForm.numberEmbryosTransferred !== "" ? parseInt(addTransferForm.numberEmbryosTransferred, 10) : null,
          numberImplanted: addTransferForm.numberImplanted !== "" ? parseInt(addTransferForm.numberImplanted, 10) : null,
          notes: addTransferForm.notes.trim() || null,
          embryoIds: addTransferForm.embryoIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add transfer");
        return;
      }
      setShowAddTransfer(null);
      setAddTransferForm({ transferDate: "", transferType: "fresh", numberEmbryosTransferred: "", numberImplanted: "", notes: "", embryoIds: [] });
      fetchTransfers(cycleId);
      fetchEmbryos(cycleId);
    } finally {
      setAddTransferLoading(false);
    }
  };

  const handleSaveTransfer = async (cycleId: string, transferId: string) => {
    const body: Record<string, unknown> = {};
    if (editTransferForm.transferDate !== undefined) body.transferDate = editTransferForm.transferDate;
    if (editTransferForm.transferType !== undefined) body.transferType = editTransferForm.transferType;
    if (editTransferForm.numberEmbryosTransferred !== undefined) body.numberEmbryosTransferred = editTransferForm.numberEmbryosTransferred;
    if (editTransferForm.numberImplanted !== undefined) body.numberImplanted = editTransferForm.numberImplanted;
    if (editTransferForm.notes !== undefined) body.notes = editTransferForm.notes;
    if (editTransferForm.embryoIds !== undefined) body.embryoIds = editTransferForm.embryoIds;
    if (Object.keys(body).length === 0) return;
    setSaveTransferLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      setEditingTransferId(null);
      setEditTransferForm({});
      fetchTransfers(cycleId);
      fetchEmbryos(cycleId);
    } finally {
      setSaveTransferLoading(false);
    }
  };

  const handleAddCryoStraw = async (cycleId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!addCryoForm.embryoId || !addCryoForm.frozenAt.trim()) return;
    setAddCryoLoading(true);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/cryo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embryoId: addCryoForm.embryoId,
          strawLabel: addCryoForm.strawLabel.trim() || null,
          storageLocation: addCryoForm.storageLocation.trim() || null,
          frozenAt: addCryoForm.frozenAt,
          notes: addCryoForm.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to add cryo straw");
        return;
      }
      setShowAddCryo(null);
      setAddCryoForm({ embryoId: "", strawLabel: "", storageLocation: "", frozenAt: "", notes: "" });
      fetchCryo(cycleId);
      fetchEmbryos(cycleId);
    } finally {
      setAddCryoLoading(false);
    }
  };

  const handleRecordThaw = async (cycleId: string, strawId: string) => {
    setRecordingThawStrawId(strawId);
    try {
      const res = await fetch(`/api/app/ivf-cycles/${cycleId}/cryo/${strawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thawedAt: new Date().toISOString() }),
      });
      if (!res.ok) return;
      fetchCryo(cycleId);
      fetchEmbryos(cycleId);
    } finally {
      setRecordingThawStrawId(null);
    }
  };

  const openAddPrescription = () => {
    setShowAddPrescription(true);
    setAddPrescriptionError(null);
    setAddPrescriptionForm({
      startDate: "",
      endDate: "",
      notes: "",
      medicationIds: [],
      medicationGroupId: "",
      quantity: "1",
      durationDays: "",
      frequency: "",
      instructionsOverride: "",
    });
    fetch("/api/app/medications")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Array<{ id: string; brandName: string; genericName: string; dosage: string; form: string }>) =>
        setFormularyMedications(list)
      );
    fetch("/api/app/medication-groups")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Array<{ id: string; name: string; description: string | null }>) =>
        setProtocolGroups(list)
      );
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPrescriptionError(null);
    if (addPrescriptionMode === "formulary") {
      if (addPrescriptionForm.medicationIds.length === 0) {
        setAddPrescriptionError("Select at least one medication from the formulary.");
        return;
      }
    } else {
      if (!addPrescriptionForm.medicationGroupId) {
        setAddPrescriptionError("Select a protocol.");
        return;
      }
    }
    setAddPrescriptionLoading(true);
    try {
      const body: {
        startDate?: string | null;
        endDate?: string | null;
        notes?: string | null;
        lines?: Array<{ medicationId: string; quantity?: string; durationDays?: number | null; frequency?: string | null; instructionsOverride?: string | null }>;
        medicationGroupId?: string;
        quantity?: string;
        durationDays?: number | null;
        frequency?: string | null;
        instructionsOverride?: string | null;
      } = {
        startDate: addPrescriptionForm.startDate || null,
        endDate: addPrescriptionForm.endDate || null,
        notes: addPrescriptionForm.notes.trim() || null,
      };
      if (addPrescriptionMode === "formulary") {
        body.lines = addPrescriptionForm.medicationIds.map((medicationId) => ({
          medicationId,
          quantity: addPrescriptionForm.quantity || "1",
          durationDays: addPrescriptionForm.durationDays ? parseInt(addPrescriptionForm.durationDays, 10) : null,
          frequency: addPrescriptionForm.frequency.trim() || null,
          instructionsOverride: addPrescriptionForm.instructionsOverride.trim() || null,
        }));
      } else {
        body.medicationGroupId = addPrescriptionForm.medicationGroupId;
        body.quantity = addPrescriptionForm.quantity || "1";
        body.durationDays = addPrescriptionForm.durationDays ? parseInt(addPrescriptionForm.durationDays, 10) : null;
        body.frequency = addPrescriptionForm.frequency.trim() || null;
        body.instructionsOverride = addPrescriptionForm.instructionsOverride.trim() || null;
      }
      const res = await fetch(`/api/app/patients/${patientId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddPrescriptionError(data.error || "Failed to add prescription.");
        return;
      }
      setShowAddPrescription(false);
      fetchPrescriptions();
    } finally {
      setAddPrescriptionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddNoteError(null);
    setAddNoteLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: addNoteForm.subjective.trim() || undefined,
          objective: addNoteForm.objective.trim() || undefined,
          assessment: addNoteForm.assessment.trim() || undefined,
          plan: addNoteForm.plan.trim() || undefined,
          diagnosisCode: addNoteForm.diagnosisCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddNoteError(data.error || "Failed to add note");
        return;
      }
      setShowAddNote(false);
      setAddNoteForm({ subjective: "", objective: "", assessment: "", plan: "", diagnosisCode: "" });
      fetchNotes();
    } finally {
      setAddNoteLoading(false);
    }
  };

  const handleSaveNote = async (noteId: string) => {
    setSaveNoteLoading(true);
    try {
      const res = await fetch(`/api/app/clinical-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: editNoteForm.subjective ?? undefined,
          objective: editNoteForm.objective ?? undefined,
          assessment: editNoteForm.assessment ?? undefined,
          plan: editNoteForm.plan ?? undefined,
          diagnosisCode: editNoteForm.diagnosisCode ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddNoteError(data.error || "Failed to update note");
        return;
      }
      setEditingNoteId(null);
      fetchNotes();
    } finally {
      setSaveNoteLoading(false);
    }
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          dateOfBirth: form.dateOfBirth || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          country: form.country?.trim() || null,
          postalCode: form.postalCode?.trim() || null,
          gender: form.gender?.trim() || null,
          notes: form.notes?.trim() || null,
          nationalIdType: form.nationalIdType?.trim() || null,
          nationalIdValue: form.nationalIdValue?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to update");
        return;
      }
      setPatient(data);
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        country: data.country ?? "",
        postalCode: data.postalCode ?? "",
        gender: data.gender ?? "",
        notes: data.notes ?? "",
        nationalIdType: data.nationalIdType ?? "",
        nationalIdValue: data.nationalIdValue ?? "",
      });
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintLabel = async (action: "preview" | "download") => {
    if (!patient?.mrNumber) {
      setPrintError("Patient has no MR number.");
      return;
    }
    setPrintError(null);
    setPrintLoading(true);
    try {
      const res = await fetch("/api/app/print/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: printLabelType,
          patientId,
          variant: "with_barcode",
          printerType: printPrinterType,
          recordPrintJob: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPrintError(data.error || "Failed to generate label");
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      const blob = await res.blob();
      if (contentType.includes("text/html")) {
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (w) w.focus();
        else {
          const a = document.createElement("a");
          a.href = url;
          a.download = `label-${printLabelType}.html`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("content-disposition")?.match(/filename="?([^";]+)"?/)?.[1] || `label-${printLabelType}.zpl`;
        a.click();
        URL.revokeObjectURL(url);
      }
      if (action === "preview" && !contentType.includes("text/html")) {
        setPrintError("Preview is only available for PDF (HTML) printer type.");
      }
    } finally {
      setPrintLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete patient");
        setShowDeleteConfirm(false);
        return;
      }
      router.push("/app/patients");
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading…</div>;
  if (error || !patient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">{error ?? "Patient not found"}</p>
        <Link href="/app/patients" className="mt-4 inline-block text-blue-700 font-medium hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete patient</h3>
            <p className="text-slate-600 mb-4">
              Permanently remove this patient and all related records (appointments, lab orders, notes, etc.)? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePatient}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/app/patients"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to patients
        </Link>
        {!editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPrintError(null);
                setShowPrintLabels(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]"
              aria-label="Print labels"
            >
              <Printer className="w-4 h-4" />
              Print labels
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-700 font-medium hover:bg-red-50 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete patient
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{saveError}</p>
        )}
        {editing ? (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  className={inputClass}
                  value={form.firstName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  className={inputClass}
                  value={form.lastName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date of birth</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <input
                  className={inputClass}
                  value={form.gender ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">Used for portal 2FA (OTP) when patient signs in via prescription QR.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>National ID type (portal 2FA)</label>
                <select
                  className={inputClass}
                  value={form.nationalIdType ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, nationalIdType: e.target.value || null }))}
                >
                  <option value="">—</option>
                  <option value="national_id">National ID</option>
                  <option value="ssn">SSN</option>
                  <option value="citizen_id">Citizen ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>National ID value (portal 2FA)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.nationalIdValue ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, nationalIdValue: e.target.value }))}
                  placeholder="ID number on file"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                className={inputClass}
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input className={inputClass} value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input className={inputClass} value={form.country ?? ""} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Postal code</label>
                <input className={inputClass} value={form.postalCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={3}
                className={inputClass}
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              {patient.firstName} {patient.lastName}
            </h1>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patient.mrNumber && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">MR number</dt>
                  <dd className="text-slate-900 mt-0.5 font-mono font-semibold">{patient.mrNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date of birth</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</dt>
                <dd className="text-slate-900 mt-0.5">{patient.gender ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</dt>
                <dd className="text-slate-900 mt-0.5">{patient.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</dt>
                <dd className="text-slate-900 mt-0.5 flex items-center gap-2">
                  {patient.phone ?? "—"}
                  {patient.phone && (
                    patient.phoneVerifiedAt ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Verified</span>
                    ) : (
                      <VerifyPhoneButton
                        patientId={patient.id}
                        phone={patient.phone}
                        onVerified={() => fetchPatient()}
                      />
                    )
                  )}
                </dd>
              </div>
              {(patient.nationalIdType || patient.nationalIdValue) && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">National ID (portal 2FA)</dt>
                  <dd className="text-slate-900 mt-0.5">
                    {[patient.nationalIdType?.replace("_", " "), patient.nationalIdValue].filter(Boolean).join(": ") || "—"}
                  </dd>
                </div>
              )}
              {(patient.address || patient.city) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</dt>
                  <dd className="text-slate-900 mt-0.5">
                    {[patient.address, [patient.city, patient.state, patient.postalCode].filter(Boolean).join(", "), patient.country]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
              )}
              {patient.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</dt>
                  <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap">{patient.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Added</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.createdAt)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {/* Clinical notes (SOAP) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Clinical notes
        </h2>
        {notesLoading ? (
          <p className="text-slate-500">Loading notes…</p>
        ) : (
          <>
            {!showAddNote ? (
              <button
                type="button"
                onClick={() => setShowAddNote(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 mb-4"
              >
                <Plus className="w-4 h-4" />
                Add note
              </button>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">New SOAP note</h3>
                {addNoteError && <p className="text-sm text-red-600 mb-2">{addNoteError}</p>}
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div>
                    <label className={labelClass}>Subjective</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.subjective} onChange={(e) => setAddNoteForm((f) => ({ ...f, subjective: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Objective</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.objective} onChange={(e) => setAddNoteForm((f) => ({ ...f, objective: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Assessment</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.assessment} onChange={(e) => setAddNoteForm((f) => ({ ...f, assessment: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Plan</label>
                    <textarea rows={2} className={inputClass} value={addNoteForm.plan} onChange={(e) => setAddNoteForm((f) => ({ ...f, plan: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Diagnosis code</label>
                    <input className={inputClass} value={addNoteForm.diagnosisCode} onChange={(e) => setAddNoteForm((f) => ({ ...f, diagnosisCode: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={addNoteLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addNoteLoading ? "Saving…" : "Save note"}</button>
                  </div>
                </form>
              </div>
            )}
            {notes.length === 0 && !showAddNote ? (
              <p className="text-slate-500">No clinical notes yet. Add one above.</p>
            ) : (
              <ul className="space-y-4">
                {notes.map((note) => (
                  <li key={note.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100"
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    >
                      <span className="font-medium text-slate-900">{formatDate(note.createdAt)} — {note.authorName}</span>
                      <span className="text-slate-500 text-sm">{expandedNoteId === note.id ? "Collapse" : "Expand"}</span>
                    </button>
                    {expandedNoteId === note.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            {["subjective", "objective", "assessment", "plan"].map((key) => (
                              <div key={key}>
                                <label className={labelClass}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                <textarea
                                  rows={2}
                                  className={inputClass}
                                  value={(editNoteForm as Record<string, string>)[key] ?? (note as Record<string, string>)[key] ?? ""}
                                  onChange={(e) => setEditNoteForm((f) => ({ ...f, [key]: e.target.value }))}
                                />
                              </div>
                            ))}
                            <div>
                              <label className={labelClass}>Diagnosis code</label>
                              <input
                                className={inputClass}
                                value={editNoteForm.diagnosisCode ?? note.diagnosisCode ?? ""}
                                onChange={(e) => setEditNoteForm((f) => ({ ...f, diagnosisCode: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingNoteId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                              <button type="button" onClick={() => handleSaveNote(note.id)} disabled={saveNoteLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{saveNoteLoading ? "Saving…" : "Save"}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <dl className="grid grid-cols-1 gap-2 text-sm">
                              <div><dt className="text-slate-500">Subjective</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.subjective || "—"}</dd></div>
                              <div><dt className="text-slate-500">Objective</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.objective || "—"}</dd></div>
                              <div><dt className="text-slate-500">Assessment</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.assessment || "—"}</dd></div>
                              <div><dt className="text-slate-500">Plan</dt><dd className="text-slate-900 whitespace-pre-wrap">{note.plan || "—"}</dd></div>
                              {note.diagnosisCode && <div><dt className="text-slate-500">Diagnosis code</dt><dd className="text-slate-900">{note.diagnosisCode}</dd></div>}
                            </dl>
                            <button type="button" onClick={() => { setEditingNoteId(note.id); setEditNoteForm({ subjective: note.subjective ?? "", objective: note.objective ?? "", assessment: note.assessment ?? "", plan: note.plan ?? "", diagnosisCode: note.diagnosisCode ?? "" }); }} className="mt-3 text-sm text-blue-700 font-medium hover:underline">Edit note</button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Diagnosis (ICD-11) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-slate-600" />
          Diagnosis (ICD-11)
        </h2>
        {diagnosesLoading ? (
          <p className="text-slate-500">Loading diagnoses…</p>
        ) : (
          <>
            {!showAddDiagnosis ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddDiagnosis("icd11")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  Search ICD-11
                </button>
                {canAddCustomDiagnosis && (
                  <button
                    type="button"
                    onClick={() => setShowAddDiagnosis("custom")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add custom diagnosis
                  </button>
                )}
              </div>
            ) : showAddDiagnosis === "icd11" ? (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Add ICD-11 diagnosis</h3>
                {addDiagnosisError && <p className="text-sm text-red-600 mb-2">{addDiagnosisError}</p>}
                <form onSubmit={handleAddDiagnosisIcd11} className="space-y-3">
                  <div>
                    <label className={labelClass}>Search by code or title</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={icd11Query}
                      onChange={(e) => { setIcd11Query(e.target.value); setSelectedIcd11(null); }}
                      placeholder="e.g. GA31 or infertility"
                      autoComplete="off"
                    />
                  </div>
                  {icd11Searching && <p className="text-sm text-slate-500">Searching…</p>}
                  {icd11Results.length > 0 && !selectedIcd11 && (
                    <ul className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {icd11Results.map((ent) => (
                        <li key={ent.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-slate-100 flex justify-between gap-2"
                            onClick={() => setSelectedIcd11(ent)}
                          >
                            <span className="font-mono text-sm text-slate-700">{ent.code}</span>
                            <span className="text-slate-900 truncate">{ent.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedIcd11 && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900 mb-1">
                        <span className="font-mono text-blue-700">{selectedIcd11.code}</span> — {selectedIcd11.title}
                      </p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">ICD-11 Disease Detail</p>
                      <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{selectedIcd11.description || "No description available."}</p>
                      {selectedIcd11.chapterTitle && (
                        <p className="text-sm text-slate-600 mt-2">Chapter: {selectedIcd11.chapterTitle}</p>
                      )}
                      <button type="button" className="mt-2 text-sm text-slate-500 hover:underline" onClick={() => setSelectedIcd11(null)}>Change selection</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowAddDiagnosis(null); setIcd11Query(""); setSelectedIcd11(null); setIcd11Results([]); }} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={!selectedIcd11 || addDiagnosisLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addDiagnosisLoading ? "Adding…" : "Add diagnosis"}</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Add custom diagnosis (if not in ICD-11)</h3>
                {addDiagnosisError && <p className="text-sm text-red-600 mb-2">{addDiagnosisError}</p>}
                <form onSubmit={handleAddDiagnosisCustom} className="space-y-3">
                  <div>
                    <label className={labelClass}>Custom diagnosis text</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={customDiagnosisText}
                      onChange={(e) => setCustomDiagnosisText(e.target.value)}
                      placeholder="Enter diagnosis when not found in ICD-11"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowAddDiagnosis(null); setCustomDiagnosisText(""); }} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={!customDiagnosisText.trim() || addDiagnosisLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addDiagnosisLoading ? "Adding…" : "Add diagnosis"}</button>
                  </div>
                </form>
              </div>
            )}
            {diagnoses.length === 0 && !showAddDiagnosis ? (
              <p className="text-slate-500">No diagnoses recorded. Search ICD-11 or add a custom diagnosis (if permitted).</p>
            ) : (
              <ul className="space-y-4">
                {diagnoses.map((d) => (
                  <li key={d.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100"
                      onClick={() => setExpandedDiagnosisId(expandedDiagnosisId === d.id ? null : d.id)}
                    >
                      <span className="font-medium text-slate-900">
                        {d.icd11 ? `${d.icd11.code} — ${d.icd11.title}` : (d.customDiagnosis || "Custom diagnosis")}
                      </span>
                      <span className="text-slate-500 text-sm flex items-center gap-2">
                        {formatDate(d.recordedAt)}
                        {d.recordedByName && ` · ${d.recordedByName}`}
                        {expandedDiagnosisId === d.id ? "Collapse" : "Expand"}
                      </span>
                    </button>
                    {expandedDiagnosisId === d.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        {d.icd11 ? (
                          <>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ICD-11 Disease Detail</p>
                            <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{d.icd11.description || "No description available."}</p>
                            {d.icd11.chapterTitle && <p className="text-sm text-slate-600 mt-2">Chapter: {d.icd11.chapterTitle}</p>}
                          </>
                        ) : (
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{d.customDiagnosis || "—"}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Recorded {formatDate(d.recordedAt)}{d.recordedByName ? ` by ${d.recordedByName}` : ""}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDiagnosis(d.id)}
                            disabled={deleteDiagnosisLoading === d.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deleteDiagnosisLoading === d.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* IVF cycles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-slate-600" />
          IVF cycles
        </h2>
        {cyclesLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <>
            {!showAddCycle ? (
              <button
                type="button"
                onClick={() => setShowAddCycle(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 mb-4"
              >
                <Plus className="w-4 h-4" />
                Add cycle
              </button>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">New IVF cycle</h3>
                <form onSubmit={handleAddCycle} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Cycle number</label>
                      <input className={inputClass} value={addCycleForm.cycleNumber} onChange={(e) => setAddCycleForm((f) => ({ ...f, cycleNumber: e.target.value }))} placeholder="e.g. 1" required />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select className={inputClass} value={addCycleForm.cycleType} onChange={(e) => setAddCycleForm((f) => ({ ...f, cycleType: e.target.value }))}>
                        <option value="fresh">Fresh</option>
                        <option value="frozen">Frozen</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start date</label>
                      <input type="date" className={inputClass} value={addCycleForm.startDate} onChange={(e) => setAddCycleForm((f) => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>End date</label>
                      <input type="date" className={inputClass} value={addCycleForm.endDate} onChange={(e) => setAddCycleForm((f) => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Notes</label>
                    <textarea rows={2} className={inputClass} value={addCycleForm.notes} onChange={(e) => setAddCycleForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddCycle(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={addCycleLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60">{addCycleLoading ? "Saving…" : "Add cycle"}</button>
                  </div>
                </form>
              </div>
            )}
            {cycles.length === 0 && !showAddCycle ? (
              <p className="text-slate-500">No IVF cycles yet. Add one above.</p>
            ) : (
              <ul className="space-y-4">
                {cycles.map((cycle) => (
                  <li key={cycle.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100"
                      onClick={() => setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id)}
                    >
                      <span className="font-medium text-slate-900">Cycle {cycle.cycleNumber} — {cycle.cycleType} · {cycle.status}</span>
                      <span className="text-slate-500 text-sm">{cycle.startDate ? formatDate(cycle.startDate) : "—"}</span>
                    </button>
                    {expandedCycleId === cycle.id && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div><dt className="text-slate-500">Type</dt><dd className="text-slate-900 capitalize">{cycle.cycleType}</dd></div>
                          <div><dt className="text-slate-500">Status</dt><dd className="text-slate-900 capitalize">{cycle.status}</dd></div>
                          <div><dt className="text-slate-500">Start</dt><dd className="text-slate-900">{cycle.startDate ? formatDate(cycle.startDate) : "—"}</dd></div>
                          <div><dt className="text-slate-500">End</dt><dd className="text-slate-900">{cycle.endDate ? formatDate(cycle.endDate) : "—"}</dd></div>
                          {cycle.notes && <div className="col-span-2"><dt className="text-slate-500">Notes</dt><dd className="text-slate-900 whitespace-pre-wrap">{cycle.notes}</dd></div>}
                        </dl>
                        <h4 className="font-semibold text-slate-900 mb-2">Embryology</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Oocyte retrieval (OPU)</h5>
                            {(cycleOpu[cycle.id] ?? []).length === 0 && showAddOpu !== cycle.id && (
                              <p className="text-slate-500 text-sm mb-2">No OPU recorded.</p>
                            )}
                            {(cycleOpu[cycle.id] ?? []).length > 0 && (cycleOpu[cycle.id] ?? []).map((opu) => (
                              <div key={opu.id} className="text-sm mb-2">
                                {editingOpuId === opu.id ? (
                                  <div className="space-y-2">
                                    <input type="date" className={inputClass + " py-1.5"} value={editOpuForm.retrievalDate ? editOpuForm.retrievalDate.toString().slice(0, 10) : ""} onChange={(e) => setEditOpuForm((f) => ({ ...f, retrievalDate: e.target.value }))} />
                                    <div className="grid grid-cols-2 gap-1">
                                      <div><label className="text-xs text-slate-500">Total</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={String(editOpuForm.oocytesTotal ?? opu.oocytesTotal ?? "")} onChange={(e) => setEditOpuForm((f) => ({ ...f, oocytesTotal: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div>
                                      <div><label className="text-xs text-slate-500">Mature</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={String(editOpuForm.oocytesMature ?? opu.oocytesMature ?? "")} onChange={(e) => setEditOpuForm((f) => ({ ...f, oocytesMature: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div>
                                      <div><label className="text-xs text-slate-500">Immature</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={String(editOpuForm.oocytesImmature ?? opu.oocytesImmature ?? "")} onChange={(e) => setEditOpuForm((f) => ({ ...f, oocytesImmature: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div>
                                      <div><label className="text-xs text-slate-500">MII</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={String(editOpuForm.oocytesMii ?? opu.oocytesMii ?? "")} onChange={(e) => setEditOpuForm((f) => ({ ...f, oocytesMii: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div>
                                      <div><label className="text-xs text-slate-500">GV</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={String(editOpuForm.oocytesGv ?? opu.oocytesGv ?? "")} onChange={(e) => setEditOpuForm((f) => ({ ...f, oocytesGv: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div>
                                    </div>
                                    <input className={inputClass + " py-1.5"} placeholder="Notes" value={editOpuForm.notes ?? opu.notes ?? ""} onChange={(e) => setEditOpuForm((f) => ({ ...f, notes: e.target.value }))} />
                                    <div className="flex gap-2"><button type="button" onClick={() => handleSaveOpu(cycle.id, opu.id)} disabled={saveOpuLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Save</button><button type="button" onClick={() => { setEditingOpuId(null); setEditOpuForm({}); }} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button></div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-slate-800">{opu.retrievalDate ? formatDate(opu.retrievalDate) : "—"} · Total: {opu.oocytesTotal ?? "—"} · Mature: {opu.oocytesMature ?? "—"} · MII: {opu.oocytesMii ?? "—"} · GV: {opu.oocytesGv ?? "—"}</p>
                                    {opu.notes && <p className="text-slate-500 text-xs">{opu.notes}</p>}
                                    <button type="button" onClick={() => { setEditingOpuId(opu.id); setEditOpuForm({ retrievalDate: opu.retrievalDate ?? "", oocytesTotal: opu.oocytesTotal ?? null, oocytesMature: opu.oocytesMature ?? null, oocytesImmature: opu.oocytesImmature ?? null, oocytesMii: opu.oocytesMii ?? null, oocytesGv: opu.oocytesGv ?? null, notes: opu.notes ?? "" }); }} className="text-blue-700 text-xs hover:underline">Edit</button>
                                  </>
                                )}
                              </div>
                            ))}
                            {showAddOpu === cycle.id ? (
                              <form onSubmit={(e) => handleAddOpu(cycle.id, e)} className="space-y-2">
                                <input type="date" className={inputClass + " py-1.5 w-full"} value={addOpuForm.retrievalDate} onChange={(e) => setAddOpuForm((f) => ({ ...f, retrievalDate: e.target.value }))} />
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  <div><label className="text-slate-500">Total</label><input type="number" min={0} className={inputClass + " py-1"} value={addOpuForm.oocytesTotal} onChange={(e) => setAddOpuForm((f) => ({ ...f, oocytesTotal: e.target.value }))} /></div>
                                  <div><label className="text-slate-500">Mature</label><input type="number" min={0} className={inputClass + " py-1"} value={addOpuForm.oocytesMature} onChange={(e) => setAddOpuForm((f) => ({ ...f, oocytesMature: e.target.value }))} /></div>
                                  <div><label className="text-slate-500">Immature</label><input type="number" min={0} className={inputClass + " py-1"} value={addOpuForm.oocytesImmature} onChange={(e) => setAddOpuForm((f) => ({ ...f, oocytesImmature: e.target.value }))} /></div>
                                  <div><label className="text-slate-500">MII</label><input type="number" min={0} className={inputClass + " py-1"} value={addOpuForm.oocytesMii} onChange={(e) => setAddOpuForm((f) => ({ ...f, oocytesMii: e.target.value }))} /></div>
                                  <div><label className="text-slate-500">GV</label><input type="number" min={0} className={inputClass + " py-1"} value={addOpuForm.oocytesGv} onChange={(e) => setAddOpuForm((f) => ({ ...f, oocytesGv: e.target.value }))} /></div>
                                </div>
                                <input className={inputClass + " py-1.5"} placeholder="Notes" value={addOpuForm.notes} onChange={(e) => setAddOpuForm((f) => ({ ...f, notes: e.target.value }))} />
                                <div className="flex gap-2"><button type="button" onClick={() => setShowAddOpu(null)} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button><button type="submit" disabled={addOpuLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Add OPU</button></div>
                              </form>
                            ) : (
                              <button type="button" onClick={() => setShowAddOpu(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add OPU</button>
                            )}
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Fertilization</h5>
                            {(cycleFertilization[cycle.id] ?? []).length === 0 && showAddFertilization !== cycle.id && (
                              <p className="text-slate-500 text-sm mb-2">No fertilization recorded.</p>
                            )}
                            {(cycleFertilization[cycle.id] ?? []).length > 0 && (cycleFertilization[cycle.id] ?? []).map((fert) => (
                              <div key={fert.id} className="text-sm mb-2">
                                {editingFertId === fert.id ? (
                                  <div className="space-y-2">
                                    <select className={inputClass + " py-1.5"} value={editFertForm.fertilizationType ?? fert.fertilizationType} onChange={(e) => setEditFertForm((f) => ({ ...f, fertilizationType: e.target.value }))}><option value="ivf">IVF</option><option value="icsi">ICSI</option><option value="half_icsi">Half ICSI</option></select>
                                    <div className="grid grid-cols-2 gap-1"><div><label className="text-xs text-slate-500">Insem.</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={editFertForm.oocytesInseminated ?? fert.oocytesInseminated ?? ""} onChange={(e) => setEditFertForm((f) => ({ ...f, oocytesInseminated: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div><div><label className="text-xs text-slate-500">Fert.</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={editFertForm.oocytesFertilized ?? fert.oocytesFertilized ?? ""} onChange={(e) => setEditFertForm((f) => ({ ...f, oocytesFertilized: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div><div><label className="text-xs text-slate-500">Zygotes N</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={editFertForm.zygotesNormal ?? fert.zygotesNormal ?? ""} onChange={(e) => setEditFertForm((f) => ({ ...f, zygotesNormal: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div><div><label className="text-xs text-slate-500">Zygotes Abn</label><input type="number" min={0} className={inputClass + " py-1 w-16"} value={editFertForm.zygotesAbnormal ?? fert.zygotesAbnormal ?? ""} onChange={(e) => setEditFertForm((f) => ({ ...f, zygotesAbnormal: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div></div>
                                    <input type="datetime-local" className={inputClass + " py-1.5"} value={editFertForm.performedAt ? new Date(editFertForm.performedAt).toISOString().slice(0, 16) : (fert.performedAt ? new Date(fert.performedAt).toISOString().slice(0, 16) : "")} onChange={(e) => setEditFertForm((f) => ({ ...f, performedAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
                                    <input className={inputClass + " py-1.5"} placeholder="Notes" value={editFertForm.notes ?? fert.notes ?? ""} onChange={(e) => setEditFertForm((f) => ({ ...f, notes: e.target.value }))} />
                                    <div className="flex gap-2"><button type="button" onClick={() => handleSaveFertilization(cycle.id, fert.id)} disabled={saveFertLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Save</button><button type="button" onClick={() => { setEditingFertId(null); setEditFertForm({}); }} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button></div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-slate-800 capitalize">{fert.fertilizationType} · {fert.performedAt ? formatDate(fert.performedAt) : "—"}</p>
                                    <p className="text-slate-600 text-xs">Insem: {fert.oocytesInseminated ?? "—"} · Fert: {fert.oocytesFertilized ?? "—"} · Zygotes N: {fert.zygotesNormal ?? "—"} · Abn: {fert.zygotesAbnormal ?? "—"}</p>
                                    {fert.notes && <p className="text-slate-500 text-xs">{fert.notes}</p>}
                                    <button type="button" onClick={() => { setEditingFertId(fert.id); setEditFertForm({ fertilizationType: fert.fertilizationType, oocytesInseminated: fert.oocytesInseminated, oocytesFertilized: fert.oocytesFertilized, zygotesNormal: fert.zygotesNormal, zygotesAbnormal: fert.zygotesAbnormal, performedAt: fert.performedAt ?? "", notes: fert.notes ?? "" }); }} className="text-blue-700 text-xs hover:underline">Edit</button>
                                  </>
                                )}
                              </div>
                            ))}
                            {showAddFertilization === cycle.id ? (
                              <form onSubmit={(e) => handleAddFertilization(cycle.id, e)} className="space-y-2">
                                <select className={inputClass + " py-1.5"} value={addFertForm.fertilizationType} onChange={(e) => setAddFertForm((f) => ({ ...f, fertilizationType: e.target.value }))}><option value="ivf">IVF</option><option value="icsi">ICSI</option><option value="half_icsi">Half ICSI</option></select>
                                <div className="grid grid-cols-2 gap-1 text-xs"><div><label className="text-slate-500">Inseminated</label><input type="number" min={0} className={inputClass + " py-1"} value={addFertForm.oocytesInseminated} onChange={(e) => setAddFertForm((f) => ({ ...f, oocytesInseminated: e.target.value }))} /></div><div><label className="text-slate-500">Fertilized</label><input type="number" min={0} className={inputClass + " py-1"} value={addFertForm.oocytesFertilized} onChange={(e) => setAddFertForm((f) => ({ ...f, oocytesFertilized: e.target.value }))} /></div><div><label className="text-slate-500">Zygotes normal</label><input type="number" min={0} className={inputClass + " py-1"} value={addFertForm.zygotesNormal} onChange={(e) => setAddFertForm((f) => ({ ...f, zygotesNormal: e.target.value }))} /></div><div><label className="text-slate-500">Zygotes abn</label><input type="number" min={0} className={inputClass + " py-1"} value={addFertForm.zygotesAbnormal} onChange={(e) => setAddFertForm((f) => ({ ...f, zygotesAbnormal: e.target.value }))} /></div></div>
                                <input type="datetime-local" className={inputClass + " py-1.5"} value={addFertForm.performedAt} onChange={(e) => setAddFertForm((f) => ({ ...f, performedAt: e.target.value }))} />
                                <input className={inputClass + " py-1.5"} placeholder="Notes" value={addFertForm.notes} onChange={(e) => setAddFertForm((f) => ({ ...f, notes: e.target.value }))} />
                                <div className="flex gap-2"><button type="button" onClick={() => setShowAddFertilization(null)} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button><button type="submit" disabled={addFertLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Add fertilization</button></div>
                              </form>
                            ) : (
                              <button type="button" onClick={() => setShowAddFertilization(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add fertilization</button>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">Embryos</h4>
                        {(cycleEmbryos[cycle.id] ?? []).length === 0 && showAddEmbryo !== cycle.id && (
                          <p className="text-slate-500 text-sm mb-2">No embryos recorded.</p>
                        )}
                        {(cycleEmbryos[cycle.id] ?? []).length > 0 && (
                          <table className="w-full text-sm mb-3">
                            <thead><tr className="text-left text-slate-500"><th className="pb-1">Day</th><th className="pb-1">Grade</th><th className="pb-1">Status</th><th className="pb-1 w-32"></th></tr></thead>
                            <tbody>
                              {(cycleEmbryos[cycle.id] ?? []).map((emb) => (
                                <Fragment key={emb.id}>
                                  <tr className="border-t border-slate-100">
                                    <td className="py-1.5">{emb.day ?? "—"}</td>
                                    <td>{emb.grade ?? "—"}</td>
                                    <td className="capitalize">{emb.status}</td>
                                    <td>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedEmbryoId(expandedEmbryoId === emb.id ? null : emb.id)}
                                        className="text-blue-700 font-medium hover:underline text-left"
                                      >
                                        {expandedEmbryoId === emb.id ? "Hide genetic testing" : "Genetic testing"}
                                      </button>
                                    </td>
                                  </tr>
                                  {expandedEmbryoId === emb.id && (
                                    <tr key={`${emb.id}-genetic`}>
                                      <td colSpan={4} className="p-0 align-top">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-1 mb-2">
                                          <h5 className="font-semibold text-slate-900 mb-2">Genetic testing</h5>
                                          {(embryoGeneticResults[emb.id] ?? []).length === 0 && showAddGeneticResult !== emb.id && (
                                            <p className="text-slate-500 text-sm mb-2">No genetic results recorded.</p>
                                          )}
                                          {(embryoGeneticResults[emb.id] ?? []).length > 0 && (
                                            <ul className="space-y-2 mb-3">
                                              {(embryoGeneticResults[emb.id] ?? []).map((gr) => (
                                                <li key={gr.id} className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                                                  {editingGeneticResultId === gr.id ? (
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                      <select
                                                        className={inputClass + " py-1.5 w-28"}
                                                        value={editGeneticResultForm.testType ?? gr.testType}
                                                        onChange={(e) => setEditGeneticResultForm((f) => ({ ...f, testType: e.target.value }))}
                                                      >
                                                        {["PGT-A", "PGT-M", "PGT-SR", "PGT-HLA", "other"].map((t) => (
                                                          <option key={t} value={t}>{t}</option>
                                                        ))}
                                                      </select>
                                                      <select
                                                        className={inputClass + " py-1.5 w-28"}
                                                        value={editGeneticResultForm.result ?? gr.result}
                                                        onChange={(e) => setEditGeneticResultForm((f) => ({ ...f, result: e.target.value }))}
                                                      >
                                                        {["euploid", "aneuploid", "mosaic", "inconclusive"].map((r) => (
                                                          <option key={r} value={r}>{r}</option>
                                                        ))}
                                                      </select>
                                                      <input
                                                        type="date"
                                                        className={inputClass + " py-1.5 w-36"}
                                                        value={(editGeneticResultForm.resultDate ?? gr.resultDate).toString().slice(0, 10)}
                                                        onChange={(e) => setEditGeneticResultForm((f) => ({ ...f, resultDate: e.target.value }))}
                                                      />
                                                      <input
                                                        className={inputClass + " py-1.5 w-32"}
                                                        placeholder="Lab ref"
                                                        value={editGeneticResultForm.labReference ?? gr.labReference ?? ""}
                                                        onChange={(e) => setEditGeneticResultForm((f) => ({ ...f, labReference: e.target.value }))}
                                                      />
                                                      <button type="button" onClick={() => handleSaveGeneticResult(emb.id, gr.id)} disabled={saveGeneticResultLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white disabled:opacity-60">Save</button>
                                                      <button type="button" onClick={() => { setEditingGeneticResultId(null); setEditGeneticResultForm({}); }} className="text-sm px-2 py-1 rounded border border-slate-200 text-slate-700">Cancel</button>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <span className="font-medium text-slate-800">{gr.testType}</span>
                                                      <span className="text-slate-600">{gr.result}</span>
                                                      <span className="text-slate-500">{formatDate(gr.resultDate)}</span>
                                                      {gr.labReference && <span className="text-slate-500">({gr.labReference})</span>}
                                                      <button type="button" onClick={() => { setEditingGeneticResultId(gr.id); setEditGeneticResultForm({ resultDate: gr.resultDate, testType: gr.testType, result: gr.result, labReference: gr.labReference ?? "", notes: gr.notes ?? "" }); }} className="text-blue-700 hover:underline">Edit</button>
                                                    </>
                                                  )}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                          {showAddGeneticResult === emb.id ? (
                                            <form onSubmit={(e) => handleAddGeneticResult(emb.id, e)} className="space-y-2">
                                              <div className="flex flex-wrap gap-2 items-end">
                                                <div><label className="text-xs font-medium text-slate-600">Test type</label><select className={inputClass + " py-1.5 w-28"} value={addGeneticResultForm.testType} onChange={(e) => setAddGeneticResultForm((f) => ({ ...f, testType: e.target.value }))}>{["PGT-A", "PGT-M", "PGT-SR", "PGT-HLA", "other"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                                                <div><label className="text-xs font-medium text-slate-600">Result</label><select className={inputClass + " py-1.5 w-28"} value={addGeneticResultForm.result} onChange={(e) => setAddGeneticResultForm((f) => ({ ...f, result: e.target.value }))}>{["euploid", "aneuploid", "mosaic", "inconclusive"].map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
                                                <div><label className="text-xs font-medium text-slate-600">Result date</label><input type="date" className={inputClass + " py-1.5 w-36"} value={addGeneticResultForm.resultDate} onChange={(e) => setAddGeneticResultForm((f) => ({ ...f, resultDate: e.target.value }))} required /></div>
                                                <div><label className="text-xs font-medium text-slate-600">Lab reference</label><input className={inputClass + " py-1.5 w-32"} placeholder="Optional" value={addGeneticResultForm.labReference} onChange={(e) => setAddGeneticResultForm((f) => ({ ...f, labReference: e.target.value }))} /></div>
                                                <div><label className="text-xs font-medium text-slate-600">Notes</label><input className={inputClass + " py-1.5"} placeholder="Optional" value={addGeneticResultForm.notes} onChange={(e) => setAddGeneticResultForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                                                <button type="button" onClick={() => setShowAddGeneticResult(null)} className="text-sm px-2 py-1.5 rounded border border-slate-200 text-slate-700">Cancel</button>
                                                <button type="submit" disabled={addGeneticResultLoading} className="text-sm px-2 py-1.5 rounded bg-blue-700 text-white disabled:opacity-60">{addGeneticResultLoading ? "Saving…" : "Add result"}</button>
                                              </div>
                                            </form>
                                          ) : (
                                            <button type="button" onClick={() => setShowAddGeneticResult(emb.id)} className="text-sm text-blue-700 font-medium hover:underline">Add genetic result</button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {showAddEmbryo === cycle.id ? (
                          <form onSubmit={(e) => handleAddEmbryo(cycle.id, e)} className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div><label className="text-xs font-medium text-slate-600">Day</label><input className={inputClass + " py-1.5"} value={addEmbryoForm.day} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, day: e.target.value }))} placeholder="3 or 5" /></div>
                              <div><label className="text-xs font-medium text-slate-600">Grade</label><input className={inputClass + " py-1.5"} value={addEmbryoForm.grade} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, grade: e.target.value }))} placeholder="e.g. 4AA" /></div>
                              <div><label className="text-xs font-medium text-slate-600">Status</label><select className={inputClass + " py-1.5"} value={addEmbryoForm.status} onChange={(e) => setAddEmbryoForm((f) => ({ ...f, status: e.target.value }))}><option value="fresh">Fresh</option><option value="frozen">Frozen</option><option value="transferred">Transferred</option><option value="discarded">Discarded</option></select></div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setShowAddEmbryo(null)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">Cancel</button>
                              <button type="submit" disabled={addEmbryoLoading} className="text-sm px-3 py-1.5 rounded-lg bg-blue-700 text-white disabled:opacity-60">{addEmbryoLoading ? "Saving…" : "Add embryo"}</button>
                            </div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setShowAddEmbryo(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add embryo</button>
                        )}
                        <h4 className="font-semibold text-slate-900 mb-2 mt-4">Transfers</h4>
                        {(cycleTransfers[cycle.id] ?? []).length === 0 && showAddTransfer !== cycle.id && (
                          <p className="text-slate-500 text-sm mb-2">No transfers recorded.</p>
                        )}
                        {(cycleTransfers[cycle.id] ?? []).length > 0 && (cycleTransfers[cycle.id] ?? []).map((tr) => (
                          <div key={tr.id} className="text-sm mb-2 p-2 bg-slate-50 rounded border border-slate-200">
                            {editingTransferId === tr.id ? (
                              <div className="space-y-2">
                                <input type="date" className={inputClass + " py-1.5"} value={editTransferForm.transferDate ? editTransferForm.transferDate.toString().slice(0, 10) : (tr.transferDate ? new Date(tr.transferDate).toISOString().slice(0, 10) : "")} onChange={(e) => setEditTransferForm((f) => ({ ...f, transferDate: e.target.value }))} />
                                <select className={inputClass + " py-1.5"} value={editTransferForm.transferType ?? tr.transferType} onChange={(e) => setEditTransferForm((f) => ({ ...f, transferType: e.target.value }))}><option value="fresh">Fresh</option><option value="frozen">Frozen</option></select>
                                <div className="grid grid-cols-2 gap-1"><div><label className="text-xs text-slate-500"># Transferred</label><input type="number" min={0} className={inputClass + " py-1 w-20"} value={String(editTransferForm.numberEmbryosTransferred ?? tr.numberEmbryosTransferred ?? "")} onChange={(e) => setEditTransferForm((f) => ({ ...f, numberEmbryosTransferred: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div><div><label className="text-xs text-slate-500"># Implanted</label><input type="number" min={0} className={inputClass + " py-1 w-20"} value={String(editTransferForm.numberImplanted ?? tr.numberImplanted ?? "")} onChange={(e) => setEditTransferForm((f) => ({ ...f, numberImplanted: e.target.value === "" ? null : parseInt(e.target.value, 10) }))} /></div></div>
                                <div><label className="text-xs text-slate-500">Embryos</label><select multiple className={inputClass + " py-1.5 min-h-[80px]"} value={editTransferForm.embryoIds ?? tr.embryoIds ?? []} onChange={(e) => setEditTransferForm((f) => ({ ...f, embryoIds: Array.from(e.target.selectedOptions, (o) => o.value) }))}>{(cycleEmbryos[cycle.id] ?? []).map((emb) => (<option key={emb.id} value={emb.id}>{emb.day ?? "?"} · {emb.grade ?? "—"} ({emb.disposition ?? emb.status})</option>))}</select></div>
                                <input className={inputClass + " py-1.5"} placeholder="Notes" value={editTransferForm.notes ?? tr.notes ?? ""} onChange={(e) => setEditTransferForm((f) => ({ ...f, notes: e.target.value }))} />
                                <div className="flex gap-2"><button type="button" onClick={() => handleSaveTransfer(cycle.id, tr.id)} disabled={saveTransferLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Save</button><button type="button" onClick={() => { setEditingTransferId(null); setEditTransferForm({}); }} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button></div>
                              </div>
                            ) : (
                              <>
                                <p className="text-slate-800 capitalize">{tr.transferType} · {tr.transferDate ? formatDate(tr.transferDate) : "—"}</p>
                                <p className="text-slate-600 text-xs">Transferred: {tr.numberEmbryosTransferred ?? "—"} · Implanted: {tr.numberImplanted ?? "—"}{((tr.embryoIds ?? []).length > 0) ? ` · ${(tr.embryoIds ?? []).length} embryo(s) linked` : ""}</p>
                                {tr.notes && <p className="text-slate-500 text-xs">{tr.notes}</p>}
                                <button type="button" onClick={() => { setEditingTransferId(tr.id); setEditTransferForm({ transferDate: tr.transferDate, transferType: tr.transferType, numberEmbryosTransferred: tr.numberEmbryosTransferred, numberImplanted: tr.numberImplanted, notes: tr.notes ?? "", embryoIds: tr.embryoIds ?? [] }); }} className="text-blue-700 text-xs hover:underline">Edit</button>
                              </>
                            )}
                          </div>
                        ))}
                        {showAddTransfer === cycle.id ? (
                          <form onSubmit={(e) => handleAddTransfer(cycle.id, e)} className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-xs font-medium text-slate-600">Transfer date</label><input type="date" className={inputClass + " py-1.5"} value={addTransferForm.transferDate} onChange={(e) => setAddTransferForm((f) => ({ ...f, transferDate: e.target.value }))} required /></div>
                              <div><label className="text-xs font-medium text-slate-600">Type</label><select className={inputClass + " py-1.5"} value={addTransferForm.transferType} onChange={(e) => setAddTransferForm((f) => ({ ...f, transferType: e.target.value as "fresh" | "frozen" }))}><option value="fresh">Fresh</option><option value="frozen">Frozen</option></select></div>
                              <div><label className="text-xs font-medium text-slate-600"># Transferred</label><input type="number" min={0} className={inputClass + " py-1.5"} value={addTransferForm.numberEmbryosTransferred} onChange={(e) => setAddTransferForm((f) => ({ ...f, numberEmbryosTransferred: e.target.value }))} /></div>
                              <div><label className="text-xs font-medium text-slate-600"># Implanted</label><input type="number" min={0} className={inputClass + " py-1.5"} value={addTransferForm.numberImplanted} onChange={(e) => setAddTransferForm((f) => ({ ...f, numberImplanted: e.target.value }))} /></div>
                            </div>
                            <div><label className="text-xs font-medium text-slate-600">Link embryos (optional)</label><select multiple className={inputClass + " py-1.5 min-h-[80px] w-full"} value={addTransferForm.embryoIds} onChange={(e) => setAddTransferForm((f) => ({ ...f, embryoIds: Array.from(e.target.selectedOptions, (o) => o.value) }))}>{(cycleEmbryos[cycle.id] ?? []).map((emb) => (<option key={emb.id} value={emb.id}>{emb.day ?? "?"} · {emb.grade ?? "—"} ({emb.disposition ?? emb.status})</option>))}</select></div>
                            <input className={inputClass + " py-1.5"} placeholder="Notes" value={addTransferForm.notes} onChange={(e) => setAddTransferForm((f) => ({ ...f, notes: e.target.value }))} />
                            <div className="flex gap-2"><button type="button" onClick={() => setShowAddTransfer(null)} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button><button type="submit" disabled={addTransferLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Add transfer</button></div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setShowAddTransfer(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add transfer</button>
                        )}
                        <h4 className="font-semibold text-slate-900 mb-2 mt-4">Cryopreservation</h4>
                        {(cycleCryo[cycle.id] ?? []).length === 0 && showAddCryo !== cycle.id && (
                          <p className="text-slate-500 text-sm mb-2">No cryo straws recorded.</p>
                        )}
                        {(cycleCryo[cycle.id] ?? []).length > 0 && (cycleCryo[cycle.id] ?? []).map((straw) => {
                          const emb = (cycleEmbryos[cycle.id] ?? []).find((e) => e.id === straw.embryoId);
                          return (
                            <div key={straw.id} className="text-sm mb-2 p-2 bg-slate-50 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-slate-800">{straw.strawLabel || "Straw"} · Embryo: {emb ? `${emb.day ?? "?"} · ${emb.grade ?? "—"}` : straw.embryoId.slice(0, 8)} · {straw.storageLocation || "—"}</span>
                              <span className="text-slate-600 text-xs">Frozen: {straw.frozenAt ? formatDate(straw.frozenAt) : "—"}{straw.thawedAt ? ` · Thawed: ${formatDate(straw.thawedAt)}` : ""}</span>
                              {!straw.thawedAt && (
                                <button type="button" onClick={() => handleRecordThaw(cycle.id, straw.id)} disabled={recordingThawStrawId === straw.id} className="text-xs px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">Record thaw</button>
                              )}
                            </div>
                          );
                        })}
                        {showAddCryo === cycle.id ? (
                          <form onSubmit={(e) => handleAddCryoStraw(cycle.id, e)} className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div><label className="text-xs font-medium text-slate-600">Embryo</label><select className={inputClass + " py-1.5 w-full"} value={addCryoForm.embryoId} onChange={(e) => setAddCryoForm((f) => ({ ...f, embryoId: e.target.value }))} required>{(cycleEmbryos[cycle.id] ?? []).map((emb) => (<option key={emb.id} value={emb.id}>{emb.day ?? "?"} · {emb.grade ?? "—"} ({emb.disposition ?? emb.status})</option>))}</select></div>
                            <div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-medium text-slate-600">Straw label</label><input className={inputClass + " py-1.5"} value={addCryoForm.strawLabel} onChange={(e) => setAddCryoForm((f) => ({ ...f, strawLabel: e.target.value }))} placeholder="e.g. A1" /></div><div><label className="text-xs font-medium text-slate-600">Storage location</label><input className={inputClass + " py-1.5"} value={addCryoForm.storageLocation} onChange={(e) => setAddCryoForm((f) => ({ ...f, storageLocation: e.target.value }))} placeholder="Tank/cane" /></div></div>
                            <div><label className="text-xs font-medium text-slate-600">Frozen at</label><input type="datetime-local" className={inputClass + " py-1.5 w-full"} value={addCryoForm.frozenAt} onChange={(e) => setAddCryoForm((f) => ({ ...f, frozenAt: e.target.value }))} required /></div>
                            <input className={inputClass + " py-1.5"} placeholder="Notes" value={addCryoForm.notes} onChange={(e) => setAddCryoForm((f) => ({ ...f, notes: e.target.value }))} />
                            <div className="flex gap-2"><button type="button" onClick={() => setShowAddCryo(null)} className="text-sm px-2 py-1 rounded border border-slate-200">Cancel</button><button type="submit" disabled={addCryoLoading} className="text-sm px-2 py-1 rounded bg-blue-700 text-white">Add straw</button></div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setShowAddCryo(cycle.id)} className="text-sm text-blue-700 font-medium hover:underline">Add cryo straw</button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Prescriptions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-slate-600" />
          Prescriptions
        </h2>
        <p className="text-sm text-slate-600 mb-4">Adding instructions helps patients follow their medication plans.</p>
        {prescriptionsLoading ? (
          <p className="text-slate-500">Loading prescriptions…</p>
        ) : (
          <>
            {!showAddPrescription ? (
              <button
                type="button"
                onClick={openAddPrescription}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 mb-4 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add prescription
              </button>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">New prescription</h3>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setAddPrescriptionMode("formulary")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[44px] ${addPrescriptionMode === "formulary" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}
                  >
                    From formulary
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddPrescriptionMode("protocol")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[44px] ${addPrescriptionMode === "protocol" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}
                  >
                    From protocol
                  </button>
                </div>
                {addPrescriptionError && <p className="text-sm text-red-600 mb-2">{addPrescriptionError}</p>}
                <form onSubmit={handleAddPrescription} className="space-y-3">
                  {addPrescriptionMode === "formulary" ? (
                    <div>
                      <label className={labelClass}>Medications (select one or more)</label>
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white">
                        {formularyMedications.map((med) => (
                          <label key={med.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addPrescriptionForm.medicationIds.includes(med.id)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setAddPrescriptionForm((f) => ({ ...f, medicationIds: [...f.medicationIds, med.id] }));
                                else
                                  setAddPrescriptionForm((f) => ({ ...f, medicationIds: f.medicationIds.filter((id) => id !== med.id) }));
                              }}
                              className="rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-900">{med.brandName} / {med.genericName} — {med.dosage}</span>
                          </label>
                        ))}
                        {formularyMedications.length === 0 && <p className="text-slate-500 text-sm py-2">No medications in formulary. Add them under Formulary in the app.</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Protocol</label>
                      <select
                        className={inputClass}
                        value={addPrescriptionForm.medicationGroupId}
                        onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, medicationGroupId: e.target.value }))}
                      >
                        <option value="">Select a protocol…</option>
                        {protocolGroups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                        {protocolGroups.length === 0 && <option value="" disabled>No protocols. Add under Formulary → Protocols.</option>}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input className={inputClass} value={addPrescriptionForm.quantity} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className={labelClass}>Duration (days)</label>
                      <input type="number" min={0} className={inputClass} value={addPrescriptionForm.durationDays} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, durationDays: e.target.value }))} placeholder="e.g. 14" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Frequency</label>
                    <input className={inputClass} value={addPrescriptionForm.frequency} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, frequency: e.target.value }))} placeholder="e.g. OD, BD" />
                  </div>
                  <div>
                    <label className={labelClass}>Start date (optional)</label>
                    <input type="date" className={inputClass} value={addPrescriptionForm.startDate} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>End date (optional)</label>
                    <input type="date" className={inputClass} value={addPrescriptionForm.endDate} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Instructions override (optional)</label>
                    <textarea rows={2} className={inputClass} value={addPrescriptionForm.instructionsOverride} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, instructionsOverride: e.target.value }))} placeholder="Patient-specific instructions" />
                  </div>
                  <div>
                    <label className={labelClass}>Notes (optional)</label>
                    <textarea rows={2} className={inputClass} value={addPrescriptionForm.notes} onChange={(e) => setAddPrescriptionForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddPrescription(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]">Cancel</button>
                    <button type="submit" disabled={addPrescriptionLoading} className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]">{addPrescriptionLoading ? "Saving…" : "Add prescription"}</button>
                  </div>
                </form>
              </div>
            )}
            {prescriptions.length === 0 && !showAddPrescription ? (
              <p className="text-slate-500">No prescriptions yet. Add one above (from formulary or protocol).</p>
            ) : (
              <ul className="space-y-4">
                {prescriptions.map((rx) => (
                  <li key={rx.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
                      <span className="font-medium text-slate-900">{formatDate(rx.createdAt)} — {rx.prescribedByName}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/app/prescriptions/${rx.id}/print`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 min-h-[44px]"
                          aria-label="Print prescription"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </Link>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        rx.status === "prescribed" ? "bg-amber-100 text-amber-800" :
                        rx.status === "dispensed" ? "bg-blue-100 text-blue-800" :
                        rx.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{rx.status}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white border-t border-slate-200">
                      {rx.startDate && <p className="text-sm text-slate-600">Start: {formatDate(rx.startDate)}</p>}
                      {rx.endDate && <p className="text-sm text-slate-600">End: {formatDate(rx.endDate)}</p>}
                      {rx.notes && <p className="text-sm text-slate-700 mt-1">{rx.notes}</p>}
                      <ul className="mt-3 space-y-2">
                        {rx.lines?.map((line) => (
                          <li key={line.id} className="text-sm">
                            {line.medication ? (
                              <span className="text-slate-900">{line.medication.brandName} / {line.medication.genericName} — {line.medication.dosage} · {line.quantity} · {line.durationDays != null ? `${line.durationDays} days` : ""} · {line.frequency || "—"}</span>
                            ) : line.groupName ? (
                              <div>
                                <span className="font-medium text-slate-900">{line.groupName}</span>
                                <span className="text-slate-600"> · {line.quantity} · {line.durationDays != null ? `${line.durationDays} days` : ""} · {line.frequency || "—"}</span>
                                {line.groupItems && line.groupItems.length > 0 && (
                                  <ul className="ml-4 mt-1 text-slate-600">
                                    {line.groupItems.map((item, idx) => (
                                      <li key={idx}>{item.brandName} / {item.genericName} — {item.dosage}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                            {line.instructionsOverride && <p className="text-slate-600 mt-0.5">{line.instructionsOverride}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Print labels modal */}
      {showPrintLabels && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-labels-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 id="print-labels-title" className="text-lg font-bold text-slate-900 mb-4">
              Print labels
            </h2>
            {printError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4" role="alert">
                {printError}
              </p>
            )}
            {!patient.mrNumber && (
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
                This patient has no MR number. Save the patient to generate one.
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="label-type" className={labelClass}>
                  Label type
                </label>
                <select
                  id="label-type"
                  className={inputClass}
                  value={printLabelType}
                  onChange={(e) => setPrintLabelType(e.target.value as typeof printLabelType)}
                  aria-describedby="label-type-desc"
                >
                  <option value="wrist_band">Wrist band</option>
                  <option value="ivf_lab_barcode">IVF lab barcode</option>
                  <option value="vial_label">Vial label</option>
                  <option value="sample_bottle">Sample bottle</option>
                  <option value="medication_envelope">Medication envelope</option>
                </select>
                <p id="label-type-desc" className="text-xs text-slate-500 mt-1">
                  MR + name + DOB for wrist band; barcode variants for lab/vial/sample/envelope.
                </p>
              </div>
              <div>
                <label htmlFor="printer-type" className={labelClass}>
                  Printer type
                </label>
                <select
                  id="printer-type"
                  className={inputClass}
                  value={printPrinterType}
                  onChange={(e) => setPrintPrinterType(e.target.value as typeof printPrinterType)}
                >
                  <option value="zebra">Zebra (ZPL)</option>
                  <option value="brother">Brother</option>
                  <option value="thermal">Generic thermal</option>
                  <option value="pdf">PDF / large format</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowPrintLabels(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              {printPrinterType === "pdf" && (
                <button
                  type="button"
                  onClick={() => handlePrintLabel("preview")}
                  disabled={printLoading || !patient.mrNumber}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 disabled:opacity-60 min-h-[44px]"
                >
                  {printLoading ? "Generating…" : "Preview"}
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePrintLabel("download")}
                disabled={printLoading || !patient.mrNumber}
                className="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60 min-h-[44px]"
              >
                {printLoading ? "Generating…" : printPrinterType === "pdf" ? "Print / Download PDF" : "Download ZPL/File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
