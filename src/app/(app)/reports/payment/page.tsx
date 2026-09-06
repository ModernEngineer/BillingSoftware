"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DateRangeFilter, DEFAULT_RANGE, type DateRange } from "@/components/reports/DateRangeFilter";
import { StatCard } from "@/components/reports/StatCard";
import { Badge } from "@/components/common/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: number;
  paymentNumber: string;
  date: string;
  direction: string;
  amount: number;
  method: string;
  customer: { name: string } | null;
  supplier: { name: string } | null;
}

interface Summary {
  totalReceived: number;
  totalPaid: number;
  byMethod: { method: string; amount: number }[];
}

export default function PaymentReportPage() {
  useDocumentTitle("Payment Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/payment?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column<Row>[] = [
    { key: "paymentNumber", header: "Payment No" },
    { key: "date", header: "Date", render: (r) => formatDate(r.date), exportValue: (r) => formatDate(r.date) },
    {
      key: "direction",
      header: "Type",
      render: (r) => <Badge tone={r.direction === "RECEIVE" ? "green" : "red"}>{r.direction === "RECEIVE" ? "Received" : "Paid"}</Badge>,
      exportValue: (r) => r.direction,
    },
    { key: "party", header: "Party", render: (r) => r.customer?.name ?? r.supplier?.name ?? "-", exportValue: (r) => r.customer?.name ?? r.supplier?.name ?? "" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount), exportValue: (r) => r.amount },
    { key: "method", header: "Method" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Payment Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Received" value={formatCurrency(summary.totalReceived)} />
          <StatCard label="Total Paid" value={formatCurrency(summary.totalPaid)} />
          {summary.byMethod.map((m) => (
            <StatCard key={m.method} label={`Total ${m.method}`} value={formatCurrency(m.amount)} />
          ))}
        </div>
      )}

      <DataTable columns={columns} data={rows} loading={loading} searchKeys={["paymentNumber"]} exportFilename="payment-report" rowKey={(r) => r.id} />
    </div>
  );
}
