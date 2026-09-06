"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DateRangeFilter, DEFAULT_RANGE, type DateRange } from "@/components/reports/DateRangeFilter";
import { StatCard } from "@/components/reports/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: number;
  date: string;
  category: { name: string };
  amount: number;
  paymentMethod: string;
  description: string | null;
}

interface Summary {
  totalExpenses: number;
  byCategory: { category: string; amount: number }[];
}

export default function ExpenseReportPage() {
  useDocumentTitle("Expense Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/expense?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date), exportValue: (r) => formatDate(r.date) },
    { key: "category", header: "Category", render: (r) => r.category.name, exportValue: (r) => r.category.name },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount), exportValue: (r) => r.amount },
    { key: "paymentMethod", header: "Payment Method" },
    { key: "description", header: "Description", render: (r) => r.description ?? "-" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Expense Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} />
          {summary.byCategory.slice(0, 3).map((c) => (
            <StatCard key={c.category} label={c.category} value={formatCurrency(c.amount)} />
          ))}
        </div>
      )}

      <DataTable columns={columns} data={rows} loading={loading} searchKeys={["description"]} exportFilename="expense-report" rowKey={(r) => r.id} />
    </div>
  );
}
