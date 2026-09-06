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
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string } | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
}

interface Summary {
  totalInvoices: number;
  totalSales: number;
  totalDiscount: number;
  taxableAmount: number;
  totalGst: number;
  totalPaid: number;
  totalDue: number;
}

export default function SalesReportPage() {
  useDocumentTitle("Sales Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/sales?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column<Row>[] = [
    { key: "invoiceNumber", header: "Invoice No" },
    { key: "invoiceDate", header: "Date", render: (r) => formatDate(r.invoiceDate), exportValue: (r) => formatDate(r.invoiceDate) },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "Walk-in", exportValue: (r) => r.customer?.name ?? "Walk-in" },
    { key: "grandTotal", header: "Amount", render: (r) => formatCurrency(r.grandTotal), exportValue: (r) => r.grandTotal },
    { key: "paidAmount", header: "Paid", render: (r) => formatCurrency(r.paidAmount), exportValue: (r) => r.paidAmount },
    { key: "dueAmount", header: "Due", render: (r) => formatCurrency(r.dueAmount), exportValue: (r) => r.dueAmount },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status === "CANCELLED" ? "red" : "slate"}>{r.status}</Badge>,
      exportValue: (r) => r.status,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Sales Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Invoices" value={String(summary.totalInvoices)} />
          <StatCard label="Total Sales" value={formatCurrency(summary.totalSales)} />
          <StatCard label="Discount" value={formatCurrency(summary.totalDiscount)} />
          <StatCard label="Taxable Amount" value={formatCurrency(summary.taxableAmount)} />
          <StatCard label="GST" value={formatCurrency(summary.totalGst)} />
          <StatCard label="Paid" value={formatCurrency(summary.totalPaid)} />
          <StatCard label="Due" value={formatCurrency(summary.totalDue)} />
        </div>
      )}

      <DataTable columns={columns} data={rows} loading={loading} searchKeys={["invoiceNumber"]} exportFilename="sales-report" rowKey={(r) => r.id} />
    </div>
  );
}
