"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  FlaskConical,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";

type Overview = {
  from: string;
  to: string;
  appointments: number;
  newPatients: number;
  ivfCycles: number;
  revenuePaid: number;
  appointmentsByDay: { date: string; count: number }[];
};

export default function ReportsClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, chart: "true" });
      const res = await fetch(`/api/app/reports/overview?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const maxAppointments = data?.appointmentsByDay?.length
    ? Math.max(...data.appointmentsByDay.map((d) => d.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading…
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Appointments</span>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{data.appointments}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">New patients</span>
                <Users className="w-8 h-8 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{data.newPatients}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">IVF cycles</span>
                <FlaskConical className="w-8 h-8 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{data.ivfCycles}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Revenue (paid)</span>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${data.revenuePaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {data.appointmentsByDay.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                Appointments by day
              </h2>
              <div className="flex items-end gap-1 h-48">
                {data.appointmentsByDay.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[8px] flex flex-col items-center gap-1"
                    title={`${day.date}: ${day.count}`}
                  >
                    <div
                      className="w-full bg-blue-500 rounded-t min-h-[4px] transition-all"
                      style={{
                        height: `${Math.max((day.count / maxAppointments) * 100, 4)}%`,
                      }}
                    />
                    <span className="text-[10px] text-slate-500 truncate max-w-full">
                      {day.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-500">No data for the selected period.</p>
      )}
    </div>
  );
}
