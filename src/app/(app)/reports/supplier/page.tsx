"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency } from "@/lib/utils";
import type { Supplier } from "@/types/party";

export default function SupplierReportPage() {
  useDocumentTitle("Supplier Report");
  const { items, loading } = useCrud<Supplier>("/api/suppliers");

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Supplier", sortable: true },
    { key: "mobile", header: "Mobile" },
    { key: "totalPurchase", header: "Total Purchase", render: (r) => formatCurrency(r.totalPurchase ?? 0), exportValue: (r) => r.totalPurchase ?? 0 },
    { key: "paid", header: "Paid", render: (r) => formatCurrency(r.paid ?? 0), exportValue: (r) => r.paid ?? 0 },
    { key: "due", header: "Due", render: (r) => formatCurrency(r.due ?? 0), exportValue: (r) => r.due ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Supplier Report</h1>
      <DataTable columns={columns} data={items} loading={loading} searchKeys={["name", "mobile"]} exportFilename="supplier-report" rowKey={(r) => r.id} />
    </div>
  );
}
