"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import Link from "next/link";
import { Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseRow {
  id: number;
  purchaseNumber: string;
  purchaseDate: string;
  supplier: { name: string };
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  createdBy: { name: string };
}

export default function PurchaseHistoryPage() {
  useDocumentTitle("Purchase History");
  const { items, loading } = useCrud<PurchaseRow>("/api/purchases");

  const columns: Column<PurchaseRow>[] = [
    { key: "purchaseNumber", header: "Purchase No", sortable: true },
    { key: "purchaseDate", header: "Date", render: (r) => formatDate(r.purchaseDate), exportValue: (r) => formatDate(r.purchaseDate) },
    { key: "supplier", header: "Supplier", render: (r) => r.supplier.name, exportValue: (r) => r.supplier.name },
    { key: "grandTotal", header: "Amount", sortable: true, render: (r) => formatCurrency(r.grandTotal), exportValue: (r) => r.grandTotal },
    { key: "paidAmount", header: "Paid", render: (r) => formatCurrency(r.paidAmount), exportValue: (r) => r.paidAmount },
    { key: "dueAmount", header: "Due", render: (r) => formatCurrency(r.dueAmount), exportValue: (r) => r.dueAmount },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (r) => (
        <Badge tone={r.paymentStatus === "PAID" ? "green" : r.paymentStatus === "PARTIAL" ? "yellow" : "red"}>
          {r.paymentStatus}
        </Badge>
      ),
      exportValue: (r) => r.paymentStatus,
    },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy?.name ?? "-", exportValue: (r) => r.createdBy?.name ?? "" },
  ];

  return (
    <DataTable
      title="Purchase History"
      columns={columns}
      data={items}
      loading={loading}
      searchKeys={["purchaseNumber"]}
      exportFilename="purchase-history"
      rowKey={(r) => r.id}
      addButton={
        <Link href="/purchase/new">
          <Button>New Purchase</Button>
        </Link>
      }
      rowActions={(row) => (
        <Link href={`/purchase/invoices/${row.id}`}>
          <Button variant="ghost" size="sm" title="View">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      )}
    />
  );
}
