"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { DataTable, type Column } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatDate } from "@/lib/utils";
import type { StockTransactionRow } from "@/types/inventory";

const TYPE_LABEL: Record<string, string> = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  SALE_RETURN: "Sale Return",
  PURCHASE_RETURN: "Purchase Return",
  ADJUSTMENT: "Adjustment",
  OPENING: "Opening Stock",
  PRODUCTION_IN: "Production In",
  PRODUCTION_OUT: "Production Out",
};

export default function StockHistoryPage() {
  useDocumentTitle("Stock History");
  const { items, loading } = useCrud<StockTransactionRow>("/api/inventory/history");

  const columns: Column<StockTransactionRow>[] = [
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt), exportValue: (r) => formatDate(r.createdAt) },
    { key: "product", header: "Product", render: (r) => r.product.name, exportValue: (r) => r.product.name },
    {
      key: "type",
      header: "Transaction Type",
      render: (r) => <Badge tone="blue">{TYPE_LABEL[r.type] ?? r.type}</Badge>,
      exportValue: (r) => TYPE_LABEL[r.type] ?? r.type,
    },
    { key: "note", header: "Reference", render: (r) => r.note ?? "-" },
    { key: "quantityIn", header: "IN", render: (r) => (r.quantityIn ? r.quantityIn : "-"), exportValue: (r) => r.quantityIn },
    { key: "quantityOut", header: "OUT", render: (r) => (r.quantityOut ? r.quantityOut : "-"), exportValue: (r) => r.quantityOut },
    { key: "balance", header: "Balance", exportValue: (r) => r.balance },
    { key: "createdBy", header: "User", render: (r) => r.createdBy?.name ?? "-", exportValue: (r) => r.createdBy?.name ?? "" },
  ];

  return (
    <DataTable
      title="Stock History"
      columns={columns}
      data={items}
      loading={loading}
      exportFilename="stock-history"
      rowKey={(r) => r.id}
    />
  );
}
