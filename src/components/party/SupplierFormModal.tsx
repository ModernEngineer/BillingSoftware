"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button, Input } from "@/components/common";
import type { Supplier } from "@/types/party";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
  pan: "",
  openingBalance: 0,
  creditLimit: undefined as number | undefined,
  notes: "",
  status: true,
};

function buildForm(supplier?: Supplier | null): typeof emptyForm {
  if (!supplier) return emptyForm;
  return {
    name: supplier.name,
    mobile: supplier.mobile,
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    city: supplier.city ?? "",
    state: supplier.state ?? "",
    pincode: supplier.pincode ?? "",
    gstin: supplier.gstin ?? "",
    pan: supplier.pan ?? "",
    openingBalance: supplier.openingBalance,
    creditLimit: supplier.creditLimit ?? undefined,
    notes: supplier.notes ?? "",
    status: supplier.status,
  };
}

export function SupplierFormModal({
  open,
  onClose,
  onSave,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: typeof emptyForm) => Promise<boolean>;
  supplier?: Supplier | null;
}) {
  // Parent should remount this component (via a changing `key`) whenever it opens,
  // so this lazy initializer always reflects the right starting values.
  const [form, setForm] = useState(() => buildForm(supplier));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={supplier ? "Edit Supplier" : "Add New Supplier"} size="lg">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Supplier Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Mobile *" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
        <Input label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
        <Input
          label="Opening Balance"
          type="number"
          value={form.openingBalance}
          onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
        />
        <Input
          label="Credit Limit"
          type="number"
          value={form.creditLimit ?? ""}
          onChange={(e) => setForm({ ...form, creditLimit: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={!form.name.trim() || !form.mobile.trim()}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
