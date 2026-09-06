"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button, Input, Select } from "@/components/common";
import { useCrud } from "@/lib/useCrud";
import { toast } from "@/lib/toast-store";
import { formatCurrency, formatDate } from "@/lib/utils";

const METHODS = ["CASH", "UPI", "CARD", "BANK"];

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  categoryId: number;
  category: { name: string };
  amount: number;
  date: string;
  paymentMethod: string;
  description: string | null;
  attachment: string | null;
  createdBy: { name: string };
}

const emptyForm = {
  categoryId: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "CASH",
  description: "",
  attachment: "",
};

export default function ExpensesPage() {
  useDocumentTitle("Expenses");
  const { items, loading, create, update, remove } = useCrud<Expense>("/api/expenses");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/expense-categories").then((r) => r.json()).then(setCategories);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Expense) {
    setEditing(row);
    setForm({
      categoryId: String(row.categoryId),
      amount: row.amount,
      date: row.date.slice(0, 10),
      paymentMethod: row.paymentMethod,
      description: row.description ?? "",
      attachment: row.attachment ?? "",
    });
    setModalOpen(true);
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setForm((f) => ({ ...f, categoryId: String(created.id) }));
      setNewCategory("");
      toast.success("Category added.");
    }
  }

  async function handleSave() {
    if (!form.categoryId || form.amount <= 0) {
      toast.error("Select a category and enter a valid amount.");
      return;
    }
    setSaving(true);
    const payload = { ...form, categoryId: Number(form.categoryId) };
    const ok = editing ? await update(editing.id, payload) : await create(payload);
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

  const columns: Column<Expense>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date), exportValue: (r) => formatDate(r.date) },
    { key: "category", header: "Category", render: (r) => r.category.name, exportValue: (r) => r.category.name },
    { key: "amount", header: "Amount", sortable: true, render: (r) => formatCurrency(r.amount), exportValue: (r) => r.amount },
    { key: "paymentMethod", header: "Payment Method" },
    { key: "description", header: "Description", render: (r) => r.description ?? "-" },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy?.name ?? "-", exportValue: (r) => r.createdBy?.name ?? "" },
  ];

  return (
    <div data-tour="tour-expenses" className="flex flex-col gap-4">
      <DataTable
        title="Expenses"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["description"]}
        exportFilename="expenses"
        rowKey={(r) => r.id}
        addButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Expense
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"} size="md">
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="flex-1">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1" />
            <Button variant="outline" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
          <Input label="Amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Attachment URL (optional)" value={form.attachment} onChange={(e) => setForm({ ...form, attachment: e.target.value })} />

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        description="Are you sure you want to delete this expense record?"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
