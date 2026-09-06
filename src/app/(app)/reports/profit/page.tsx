"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DateRangeFilter, DEFAULT_RANGE, type DateRange } from "@/components/reports/DateRangeFilter";
import { formatCurrency } from "@/lib/utils";

interface Summary {
  grossSales: number;
  cost: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitPercent: number;
}

export default function ProfitReportPage() {
  useDocumentTitle("Profit Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/profit?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => setSummary(data.summary))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Profit Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {!loading && summary && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mx-auto flex max-w-md flex-col gap-3 text-sm">
            <Row label="Gross Sales" value={summary.grossSales} />
            <Row label="Cost of Goods Sold" value={-summary.cost} />
            <div className="border-t border-slate-200 pt-2">
              <Row label="Gross Profit" value={summary.grossProfit} bold />
            </div>
            <Row label="Expenses" value={-summary.expenses} />
            <div className="border-t border-slate-300 pt-2">
              <Row label="Net Profit" value={summary.netProfit} bold large />
            </div>
            <div className="mt-2 flex justify-between text-slate-600">
              <span>Profit %</span>
              <span className="font-semibold">{summary.profitPercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-400">Loading...</div>}
    </div>
  );
}

function Row({ label, value, bold, large }: { label: string; value: number; bold?: boolean; large?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""} ${large ? "text-lg" : ""}`}>
      <span className={bold ? "" : "text-slate-600"}>{label}</span>
      <span className={value < 0 ? "text-red-600" : ""}>{formatCurrency(value)}</span>
    </div>
  );
}
