"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/common";
import { toast } from "@/lib/toast-store";

const emptyForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  pan: "",
  state: "",
  pincode: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
};

export default function BusinessProfilePage() {
  useDocumentTitle("Business Profile");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((b) => {
        if (b) {
          setForm({
            name: b.name ?? "",
            address: b.address ?? "",
            phone: b.phone ?? "",
            email: b.email ?? "",
            website: b.website ?? "",
            gstin: b.gstin ?? "",
            pan: b.pan ?? "",
            state: b.state ?? "",
            pincode: b.pincode ?? "",
            bankName: b.bankName ?? "",
            accountNumber: b.accountNumber ?? "",
            ifsc: b.ifsc ?? "",
            upiId: b.upiId ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save business profile.");
      return;
    }
    toast.success("Business profile updated.");
  }

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div data-tour="tour-settings" className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Business Profile</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          <Input label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
          <Input label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <Input label="Account Number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <Input label="IFSC" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} />
          <Input label="UPI ID" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
