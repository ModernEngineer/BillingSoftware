"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DateRangeFilter, DEFAULT_RANGE, type DateRange } from "@/components/reports/DateRangeFilter";
import { StatCard } from "@/components/reports/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string; gstin: string | null } | null;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface Summary {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
}

export default function GstReportPage() {
  useDocumentTitle("GST Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/gst?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column<Row>[] = [
    { key: "invoiceNumber", header: "Invoice" },
    { key: "invoiceDate", header: "Date", render: (r) => formatDate(r.invoiceDate), exportValue: (r) => formatDate(r.invoiceDate) },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "Walk-in", exportValue: (r) => r.customer?.name ?? "" },
    { key: "gstin", header: "GSTIN", render: (r) => r.customer?.gstin ?? "-", exportValue: (r) => r.customer?.gstin ?? "" },
    { key: "taxableAmount", header: "Taxable Value", render: (r) => formatCurrency(r.taxableAmount), exportValue: (r) => r.taxableAmount },
    { key: "cgst", header: "CGST", render: (r) => formatCurrency(r.cgst), exportValue: (r) => r.cgst },
    { key: "sgst", header: "SGST", render: (r) => formatCurrency(r.sgst), exportValue: (r) => r.sgst },
    { key: "igst", header: "IGST", render: (r) => formatCurrency(r.igst), exportValue: (r) => r.igst },
    {
      key: "totalGst",
      header: "Total GST",
      render: (r) => formatCurrency(r.cgst + r.sgst + r.igst),
      exportValue: (r) => r.cgst + r.sgst + r.igst,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">GST Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Taxable Value" value={formatCurrency(summary.taxableValue)} />
          <StatCard label="CGST" value={formatCurrency(summary.cgst)} />
          <StatCard label="SGST" value={formatCurrency(summary.sgst)} />
          <StatCard label="IGST" value={formatCurrency(summary.igst)} />
          <StatCard label="Total GST" value={formatCurrency(summary.totalGst)} />
        </div>
      )}

      <DataTable columns={columns} data={rows} loading={loading} searchKeys={["invoiceNumber"]} exportFilename="gst-report" rowKey={(r) => r.id} />
    </div>
  );
}
