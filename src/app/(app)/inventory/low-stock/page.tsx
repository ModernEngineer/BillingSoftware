"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import type { StockRow } from "@/types/inventory";

export default function LowStockPage() {
  useDocumentTitle("Low Stock");
  const { items, loading } = useCrud<StockRow>("/api/inventory/stock");
  const lowStock = items.filter((r) => r.status !== "IN_STOCK");

  const columns: Column<StockRow>[] = [
    { key: "name", header: "Product", sortable: true },
    { key: "sku", header: "SKU" },
    { key: "category", header: "Category", render: (r) => r.category?.name ?? "-", exportValue: (r) => r.category?.name ?? "" },
    {
      key: "currentStock",
      header: "Current Stock",
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-red-600">
          {r.currentStock} {r.unit.shortName ?? r.unit.name}
        </span>
      ),
      exportValue: (r) => r.currentStock,
    },
    { key: "minimumStock", header: "Minimum Stock", exportValue: (r) => r.minimumStock },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status === "OUT_OF_STOCK" ? "red" : "yellow"}>{r.status === "OUT_OF_STOCK" ? "Out of Stock" : "Low Stock"}</Badge>,
      exportValue: (r) => r.status,
    },
  ];

  return (
    <DataTable
      title="Low Stock Products"
      columns={columns}
      data={lowStock}
      loading={loading}
      searchKeys={["name", "sku"]}
      exportFilename="low-stock"
      rowKey={(r) => r.id}
      emptyTitle="No low-stock products."
      emptyDescription="All products are above their minimum stock threshold."
    />
  );
}
