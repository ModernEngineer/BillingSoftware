"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { StatCard } from "@/components/reports/StatCard";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency } from "@/lib/utils";
import type { StockRow } from "@/types/inventory";

export default function StockReportPage() {
  useDocumentTitle("Stock Report");
  const { items, loading } = useCrud<StockRow>("/api/inventory/stock");

  const totalStockValue = items.reduce((sum, r) => sum + r.stockValue, 0);

  const columns: Column<StockRow>[] = [
    { key: "name", header: "Product", sortable: true },
    { key: "openingStock", header: "Opening Stock" },
    { key: "purchase", header: "Purchase" },
    { key: "sales", header: "Sales" },
    { key: "saleReturn", header: "Returns" },
    { key: "adjustment", header: "Adjustment" },
    { key: "currentStock", header: "Closing Stock", sortable: true },
    { key: "stockValue", header: "Stock Value", render: (r) => formatCurrency(r.stockValue), exportValue: (r) => r.stockValue },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Stock Report</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Products" value={String(items.length)} />
        <StatCard label="Total Stock Value" value={formatCurrency(totalStockValue)} />
      </div>
      <DataTable columns={columns} data={items} loading={loading} searchKeys={["name"]} exportFilename="stock-report" rowKey={(r) => r.id} />
    </div>
  );
}
