"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DateRangeFilter, DEFAULT_RANGE, type DateRange } from "@/components/reports/DateRangeFilter";
import { StatCard } from "@/components/reports/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: number;
  purchaseNumber: string;
  purchaseDate: string;
  supplier: { name: string };
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

interface Summary {
  totalPurchases: number;
  totalAmount: number;
  taxableAmount: number;
  totalGst: number;
  totalDiscount: number;
  totalPaid: number;
  totalDue: number;
}

export default function PurchaseReportPage() {
  useDocumentTitle("Purchase Report");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/purchase?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column<Row>[] = [
    { key: "purchaseNumber", header: "Purchase No" },
    { key: "purchaseDate", header: "Date", render: (r) => formatDate(r.purchaseDate), exportValue: (r) => formatDate(r.purchaseDate) },
    { key: "supplier", header: "Supplier", render: (r) => r.supplier.name, exportValue: (r) => r.supplier.name },
    { key: "grandTotal", header: "Amount", render: (r) => formatCurrency(r.grandTotal), exportValue: (r) => r.grandTotal },
    { key: "paidAmount", header: "Paid", render: (r) => formatCurrency(r.paidAmount), exportValue: (r) => r.paidAmount },
    { key: "dueAmount", header: "Due", render: (r) => formatCurrency(r.dueAmount), exportValue: (r) => r.dueAmount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Purchase Report</h1>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Purchases" value={String(summary.totalPurchases)} />
          <StatCard label="Total Amount" value={formatCurrency(summary.totalAmount)} />
          <StatCard label="Taxable Amount" value={formatCurrency(summary.taxableAmount)} />
          <StatCard label="GST" value={formatCurrency(summary.totalGst)} />
          <StatCard label="Paid" value={formatCurrency(summary.totalPaid)} />
          <StatCard label="Due" value={formatCurrency(summary.totalDue)} />
        </div>
      )}

      <DataTable columns={columns} data={rows} loading={loading} searchKeys={["purchaseNumber"]} exportFilename="purchase-report" rowKey={(r) => r.id} />
    </div>
  );
}
