"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button, Input } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Employee {
  id: number;
  name: string;
  designation: string | null;
  department: string | null;
  mobile: string | null;
  email: string | null;
  joiningDate: string;
  salary: number;
  status: boolean;
}

const emptyForm = {
  name: "",
  designation: "",
  department: "",
  mobile: "",
  email: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  salary: 0,
  status: true,
};

export default function EmployeesPage() {
  useDocumentTitle("Employees");
  const { items, loading, create, update, remove } = useCrud<Employee>("/api/hr/employees");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Employee) {
    setEditing(row);
    setForm({
      name: row.name,
      designation: row.designation ?? "",
      department: row.department ?? "",
      mobile: row.mobile ?? "",
      email: row.email ?? "",
      joiningDate: row.joiningDate.slice(0, 10),
      salary: row.salary,
      status: row.status,
    });
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
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const columns: Column<Employee>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "designation", header: "Designation", render: (r) => r.designation ?? "-" },
    { key: "department", header: "Department", render: (r) => r.department ?? "-" },
    { key: "mobile", header: "Mobile", render: (r) => r.mobile ?? "-" },
    { key: "joiningDate", header: "Joining Date", render: (r) => formatDate(r.joiningDate), exportValue: (r) => formatDate(r.joiningDate) },
    { key: "salary", header: "Salary", render: (r) => formatCurrency(r.salary), exportValue: (r) => r.salary },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status ? "green" : "slate"}>{r.status ? "Active" : "Inactive"}</Badge>,
      exportValue: (r) => (r.status ? "Active" : "Inactive"),
    },
  ];

  return (
    <div data-tour="tour-hr" className="flex flex-col gap-4">
      <DataTable
        title="Employees"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "mobile", "designation"]}
        exportFilename="employees"
        rowKey={(r) => r.id}
        addButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Employee
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Employee" : "Add Employee"} size="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
          <Input label="Monthly Salary *" type="number" min={0} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate employee?"
        description={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
