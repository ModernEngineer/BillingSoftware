"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/common";
import { toast } from "@/lib/toast-store";

const emptyForm = {
  invoicePrefix: "INV",
  dateFormat: "dd/MM/yyyy",
  currency: "INR",
  decimalPlaces: 2,
  showLogo: true,
  showGst: true,
  showHsn: true,
  showSignature: true,
  showTerms: true,
  termsText: "",
};

export default function InvoiceSettingsPage() {
  useDocumentTitle("Invoice Settings");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((b) => {
        if (b) {
          setForm({
            invoicePrefix: b.invoicePrefix ?? "INV",
            dateFormat: b.dateFormat ?? "dd/MM/yyyy",
            currency: b.currency ?? "INR",
            decimalPlaces: b.decimalPlaces ?? 2,
            showLogo: b.showLogo ?? true,
            showGst: b.showGst ?? true,
            showHsn: b.showHsn ?? true,
            showSignature: b.showSignature ?? true,
            showTerms: b.showTerms ?? true,
            termsText: b.termsText ?? "",
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
      toast.error("Failed to save invoice settings.");
      return;
    }
    toast.success("Invoice settings updated.");
  }

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Invoice Settings</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
          <Select label="Date Format" value={form.dateFormat} onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}>
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </Select>
          <Input label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <Input
            label="Decimal Places"
            type="number"
            min={0}
            max={4}
            value={form.decimalPlaces}
            onChange={(e) => setForm({ ...form, decimalPlaces: Number(e.target.value) })}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["showLogo", "Show Logo"],
              ["showGst", "Show GST"],
              ["showHsn", "Show HSN"],
              ["showSignature", "Show Signature"],
              ["showTerms", "Show Terms"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Terms &amp; Conditions Text</label>
          <textarea
            value={form.termsText}
            onChange={(e) => setForm({ ...form, termsText: e.target.value })}
            rows={3}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
