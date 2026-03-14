"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, AlertTriangle } from "lucide-react";

export default function LowStockCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/app/inventory/low-stock")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setCount(data.count))
      .catch(() => setCount(0));
  }, []);

  if (count === null || count === 0) return null;

  return (
    <Link
      href="/app/inventory"
      className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:border-amber-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="font-semibold text-amber-900">
            {count} item{count !== 1 ? "s" : ""} below reorder level
          </p>
          <p className="text-sm text-amber-800">Review inventory</p>
        </div>
        <Package className="w-5 h-5 text-amber-600 ml-auto" />
      </div>
    </Link>
  );
}
