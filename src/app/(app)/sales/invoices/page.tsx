"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import Link from "next/link";
import { Eye, Printer } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SaleRow {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string } | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  createdBy: { name: string };
}

export default function SalesHistoryPage() {
  useDocumentTitle("Sales History");
  const { items, loading } = useCrud<SaleRow>("/api/sales");

  const columns: Column<SaleRow>[] = [
    { key: "invoiceNumber", header: "Invoice No", sortable: true },
    { key: "invoiceDate", header: "Date", render: (r) => formatDate(r.invoiceDate), exportValue: (r) => formatDate(r.invoiceDate) },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name ?? "Walk-in", exportValue: (r) => r.customer?.name ?? "Walk-in" },
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
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status === "CANCELLED" ? "red" : "slate"}>{r.status}</Badge>,
      exportValue: (r) => r.status,
    },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy?.name ?? "-", exportValue: (r) => r.createdBy?.name ?? "" },
  ];

  return (
    <div data-tour="tour-sales-history">
    <DataTable
      title="Sales History"
      columns={columns}
      data={items}
      loading={loading}
      searchKeys={["invoiceNumber"]}
      exportFilename="sales-history"
      rowKey={(r) => r.id}
      addButton={
        <Link href="/sales/new">
          <Button>New Invoice</Button>
        </Link>
      }
      rowActions={(row) => (
        <>
          <Link href={`/sales/invoices/${row.id}`}>
            <Button variant="ghost" size="sm" title="View">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/sales/invoices/${row.id}`}>
            <Button variant="ghost" size="sm" title="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </Link>
        </>
      )}
    />
    </div>
  );
}
