"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button, Input, Select } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatDate } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  status: boolean;
  lastLogin: string | null;
  roleId: number;
  role: { name: string };
}

const emptyForm = { name: "", email: "", mobile: "", password: "", roleId: "", status: true };

export default function UsersPage() {
  useDocumentTitle("Users");
  const { items, loading, create, update, remove } = useCrud<UserRow>("/api/users");
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/roles").then((r) => r.json()).then(setRoles);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: UserRow) {
    setEditing(row);
    setForm({ name: row.name, email: row.email, mobile: row.mobile ?? "", password: "", roleId: String(row.roleId), status: row.status });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, unknown> = { ...form, roleId: Number(form.roleId) };
    if (editing && !form.password) delete payload.password;
    const ok = editing ? await update(editing.id, payload) : await create(payload);
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

  const columns: Column<UserRow>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (r) => r.role.name, exportValue: (r) => r.role.name },
    { key: "mobile", header: "Mobile", render: (r) => r.mobile ?? "-" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status ? "green" : "slate"}>{r.status ? "Active" : "Inactive"}</Badge>,
      exportValue: (r) => (r.status ? "Active" : "Inactive"),
    },
    { key: "lastLogin", header: "Last Login", render: (r) => (r.lastLogin ? formatDate(r.lastLogin) : "Never"), exportValue: (r) => (r.lastLogin ? formatDate(r.lastLogin) : "") },
  ];

  return (
    <div data-tour="tour-users" className="flex flex-col gap-4">
      <DataTable
        title="Users"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "email"]}
        exportFilename="users"
        rowKey={(r) => r.id}
        addButton={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add User
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Add User"} size="sm">
        <div className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input
            label={editing ? "New Password (leave blank to keep)" : "Password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            Active
          </label>
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
        title="Deactivate user?"
        description={`Are you sure you want to deactivate "${deleteTarget?.name}"? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
