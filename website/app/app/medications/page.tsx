import MedicationsClient from "./MedicationsClient";

export default function MedicationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Formulary & protocols</h1>
      <p className="text-slate-600">
        Manage clinic medications and medication groups (e.g. IVF Protocol). Prescriptions can only reference items from the formulary or a protocol.
      </p>
      <MedicationsClient />
    </div>
  );
}
