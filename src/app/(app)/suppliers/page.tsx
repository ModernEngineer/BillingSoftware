"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { SupplierFormModal } from "@/components/party/SupplierFormModal";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency } from "@/lib/utils";
import type { Supplier } from "@/types/party";

export default function SuppliersPage() {
  useDocumentTitle("Suppliers");
  const { items, loading, create, update, remove } = useCrud<Supplier>("/api/suppliers");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(payload: Record<string, unknown>) {
    return editing ? update(editing.id, payload) : create(payload);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Supplier Name", sortable: true },
    { key: "mobile", header: "Mobile" },
    { key: "gstin", header: "GSTIN", render: (r) => r.gstin || "-" },
    { key: "totalPurchase", header: "Total Purchase", render: (r) => formatCurrency(r.totalPurchase ?? 0), exportValue: (r) => r.totalPurchase ?? 0 },
    { key: "paid", header: "Paid", render: (r) => formatCurrency(r.paid ?? 0), exportValue: (r) => r.paid ?? 0 },
    {
      key: "due",
      header: "Due",
      render: (r) => (
        <span className={(r.due ?? 0) > 0 ? "font-semibold text-red-600" : ""}>{formatCurrency(r.due ?? 0)}</span>
      ),
      exportValue: (r) => r.due ?? 0,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status ? "green" : "slate"}>{r.status ? "Active" : "Inactive"}</Badge>,
      exportValue: (r) => (r.status ? "Active" : "Inactive"),
    },
  ];

  return (
    <div data-tour="tour-suppliers" className="flex flex-col gap-4">
      <DataTable
        title="Suppliers"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "mobile", "gstin"]}
        exportFilename="suppliers"
        rowKey={(r) => r.id}
        addButton={
          <Button
            onClick={() => {
              setEditing(null);
              setModalKey((k) => k + 1);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add New Supplier
          </Button>
        }
        rowActions={(row) => (
          <>
            <Link href={`/suppliers/${row.id}/ledger`}>
              <Button variant="ghost" size="sm" title="Ledger">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(row);
                setModalKey((k) => k + 1);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      />

      <SupplierFormModal key={modalKey} open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} supplier={editing} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete supplier?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? If they have past purchases, they'll be deactivated instead.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
