"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button, Input } from "@/components/common";
import type { Customer } from "@/types/party";

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
  paymentTerms: "",
  notes: "",
  status: true,
};

function buildForm(customer?: Customer | null): typeof emptyForm {
  if (!customer) return emptyForm;
  return {
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    pincode: customer.pincode ?? "",
    gstin: customer.gstin ?? "",
    pan: customer.pan ?? "",
    openingBalance: customer.openingBalance,
    creditLimit: customer.creditLimit ?? undefined,
    paymentTerms: customer.paymentTerms ?? "",
    notes: customer.notes ?? "",
    status: customer.status,
  };
}

export function CustomerFormModal({
  open,
  onClose,
  onSave,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: typeof emptyForm) => Promise<boolean>;
  customer?: Customer | null;
}) {
  // Parent should remount this component (via a changing `key`) whenever it opens,
  // so this lazy initializer always reflects the right starting values.
  const [form, setForm] = useState(() => buildForm(customer));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={customer ? "Edit Customer" : "Add New Customer"} size="lg">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Customer Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <Input label="Payment Terms" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
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
