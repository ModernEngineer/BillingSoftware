"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button, Input } from "@/components/common";
import { useCrud } from "@/lib/useCrud";

interface UnitRow {
  id: number;
  name: string;
  shortName: string | null;
  _count: { products: number };
}

export default function UnitsPage() {
  useDocumentTitle("Units");
  const { items, loading, create, update, remove } = useCrud<UnitRow>("/api/units");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitRow | null>(null);
  const [form, setForm] = useState({ name: "", shortName: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", shortName: "" });
    setModalOpen(true);
  }

  function openEdit(row: UnitRow) {
    setEditing(row);
    setForm({ name: row.name, shortName: row.shortName ?? "" });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const ok = editing ? await update(editing.id, form) : await create(form);
    setSaving(false);
    if (ok) setModalOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await remove(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  }

  const columns: Column<UnitRow>[] = [
    { key: "name", header: "Unit Name", sortable: true },
    { key: "shortName", header: "Short Name", render: (r) => r.shortName || "-" },
    { key: "products", header: "Products", render: (r) => r._count.products, exportValue: (r) => r._count.products },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        title="Units"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "shortName"]}
        exportFilename="units"
        rowKey={(r) => r.id}
        addButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Unit
          </Button>
        }
        rowActions={(row) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Unit" : "Add Unit"} size="sm">
        <div className="flex flex-col gap-3">
          <Input label="Unit Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Short Name" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete unit?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
