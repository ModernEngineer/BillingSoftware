"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import type { StockRow } from "@/types/inventory";

const STATUS_TONE = { IN_STOCK: "green", LOW_STOCK: "yellow", OUT_OF_STOCK: "red" } as const;
const STATUS_LABEL = { IN_STOCK: "In Stock", LOW_STOCK: "Low Stock", OUT_OF_STOCK: "Out of Stock" } as const;

export default function CurrentStockPage() {
  useDocumentTitle("Current Stock");
  const { items, loading } = useCrud<StockRow>("/api/inventory/stock");

  const columns: Column<StockRow>[] = [
    { key: "name", header: "Product", sortable: true },
    { key: "sku", header: "SKU" },
    { key: "openingStock", header: "Opening", exportValue: (r) => r.openingStock },
    { key: "purchase", header: "Purchase", exportValue: (r) => r.purchase },
    { key: "sales", header: "Sales", exportValue: (r) => r.sales },
    { key: "saleReturn", header: "Sale Return", exportValue: (r) => r.saleReturn },
    { key: "purchaseReturn", header: "Purchase Return", exportValue: (r) => r.purchaseReturn },
    { key: "adjustment", header: "Adjustment", exportValue: (r) => r.adjustment },
    {
      key: "currentStock",
      header: "Current Stock",
      sortable: true,
      render: (r) => (
        <span className="font-semibold">
          {r.currentStock} {r.unit.shortName ?? r.unit.name}
        </span>
      ),
      exportValue: (r) => r.currentStock,
    },
    { key: "minimumStock", header: "Minimum Stock", exportValue: (r) => r.minimumStock },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
      exportValue: (r) => STATUS_LABEL[r.status],
    },
  ];

  return (
    <DataTable
      title="Current Stock"
      columns={columns}
      data={items}
      loading={loading}
      searchKeys={["name", "sku"]}
      exportFilename="current-stock"
      rowKey={(r) => r.id}
    />
  );
}
