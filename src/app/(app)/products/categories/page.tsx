"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button, Input } from "@/components/common";
import { useCrud } from "@/lib/useCrud";
import { Badge } from "@/components/common/Badge";

interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  _count: { products: number };
}

export default function CategoriesPage() {
  useDocumentTitle("Categories");
  const { items, loading, create, update, remove } = useCrud<CategoryRow>("/api/categories");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", status: true });
    setModalOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setForm({ name: row.name, description: row.description ?? "", status: row.status });
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

  const columns: Column<CategoryRow>[] = [
    { key: "name", header: "Category Name", sortable: true },
    { key: "description", header: "Description", render: (r) => r.description || "-" },
    { key: "products", header: "Products", render: (r) => r._count.products, exportValue: (r) => r._count.products },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status ? "green" : "slate"}>{r.status ? "Active" : "Inactive"}</Badge>,
      exportValue: (r) => (r.status ? "Active" : "Inactive"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        title="Product Categories"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "description"]}
        exportFilename="categories"
        rowKey={(r) => r.id}
        addButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Category
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Category" : "Add Category"} size="sm">
        <div className="flex flex-col gap-3">
          <Input label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Active
          </label>
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
        title="Delete category?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
