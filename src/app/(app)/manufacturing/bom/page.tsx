"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/common";
import { toast } from "@/lib/toast-store";
import type { Product } from "@/types/product";

interface BomRow {
  id: number;
  quantity: number;
  finishedProduct: { name: string; sku: string };
  componentProduct: { name: string; sku: string; unit: { name: string; shortName: string | null } };
}

export default function BomPage() {
  useDocumentTitle("Bill of Materials");
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<BomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishedProductId, setFinishedProductId] = useState("");
  const [componentProductId, setComponentProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/manufacturing/bom")
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  async function handleAdd() {
    if (!finishedProductId || !componentProductId || quantity <= 0) {
      toast.error("Select finished product, component, and a valid quantity.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/manufacturing/bom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        finishedProductId: Number(finishedProductId),
        componentProductId: Number(componentProductId),
        quantity,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to add BOM line.");
      return;
    }
    toast.success("BOM line added.");
    setComponentProductId("");
    setQuantity(1);
    refresh();
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/manufacturing/bom/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("BOM line removed.");
      refresh();
    }
  }

  const grouped = rows.reduce<Record<string, BomRow[]>>((acc, row) => {
    const key = row.finishedProduct.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div data-tour="tour-manufacturing" className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Bill of Materials</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Add Component</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Select label="Finished Product" value={finishedProductId} onChange={(e) => setFinishedProductId(e.target.value)}>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Component Product" value={componentProductId} onChange={(e) => setComponentProductId(e.target.value)}>
            <option value="">Select component</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Input label="Quantity per Unit" type="number" min={0.01} step="0.01" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <div className="flex items-end">
            <Button onClick={handleAdd} loading={saving} className="w-full">
              Add
            </Button>
          </div>
        </div>
      </div>

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-400">
          No BOM defined yet. Add components above to define what a finished product is made of.
        </div>
      )}

      {Object.entries(grouped).map(([finishedName, items]) => (
        <div key={finishedName} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">{finishedName}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2">Component</th>
                <th className="py-2">Quantity per Unit</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2">{row.componentProduct.name}</td>
                  <td className="py-2">
                    {row.quantity} {row.componentProduct.unit.shortName ?? row.componentProduct.unit.name}
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
