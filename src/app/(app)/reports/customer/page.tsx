"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types/party";

export default function CustomerReportPage() {
  useDocumentTitle("Customer Report");
  const { items, loading } = useCrud<Customer>("/api/customers");

  const columns: Column<Customer>[] = [
    { key: "name", header: "Customer", sortable: true },
    { key: "mobile", header: "Mobile" },
    { key: "totalSales", header: "Total Sales", render: (r) => formatCurrency(r.totalSales ?? 0), exportValue: (r) => r.totalSales ?? 0 },
    { key: "paid", header: "Paid", render: (r) => formatCurrency(r.paid ?? 0), exportValue: (r) => r.paid ?? 0 },
    { key: "due", header: "Due", render: (r) => formatCurrency(r.due ?? 0), exportValue: (r) => r.due ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Customer Report</h1>
      <DataTable columns={columns} data={items} loading={loading} searchKeys={["name", "mobile"]} exportFilename="customer-report" rowKey={(r) => r.id} />
    </div>
  );
}
