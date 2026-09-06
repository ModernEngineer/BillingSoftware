"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button, Input, Select } from "@/components/common";
import { toast } from "@/lib/toast-store";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types/product";

const REASONS = ["Damage", "Lost", "Expired", "Manual Correction", "Opening Stock", "Other"];

interface AdjustmentRow {
  id: number;
  adjustmentType: "INCREASE" | "DECREASE";
  quantity: number;
  reason: string;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string };
  createdBy: { name: string };
}

export default function StockAdjustmentPage() {
  useDocumentTitle("Stock Adjustment");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/inventory/adjustments")
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  async function handleSave() {
    if (!productId || quantity <= 0) {
      toast.error("Select a product and enter a quantity greater than 0.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/inventory/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: Number(productId), adjustmentType, quantity, reason, note: note || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save adjustment.");
      return;
    }
    toast.success("Stock adjustment saved.");
    setProductId("");
    setQuantity(0);
    setNote("");
    refresh();
  }

  const columns: Column<AdjustmentRow>[] = [
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt), exportValue: (r) => formatDate(r.createdAt) },
    { key: "product", header: "Product", render: (r) => `${r.product.name} (${r.product.sku})`, exportValue: (r) => r.product.name },
    { key: "adjustmentType", header: "Type", render: (r) => (r.adjustmentType === "INCREASE" ? "Increase" : "Decrease") },
    { key: "quantity", header: "Quantity" },
    { key: "reason", header: "Reason" },
    { key: "note", header: "Note", render: (r) => r.note ?? "-" },
    { key: "createdBy", header: "User", render: (r) => r.createdBy?.name ?? "-", exportValue: (r) => r.createdBy?.name ?? "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h1 className="mb-3 text-lg font-bold text-slate-900">Stock Adjustment</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Stock: {p.currentStock}
              </option>
            ))}
          </Select>
          <Select label="Adjustment Type" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as "INCREASE" | "DECREASE")}>
            <option value="INCREASE">Increase</option>
            <option value="DECREASE">Decrease</option>
          </Select>
          <Input label="Quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3">
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Adjustment
          </Button>
        </div>
      </div>

      <DataTable
        title="Adjustment History"
        columns={columns}
        data={rows}
        loading={loading}
        exportFilename="stock-adjustments"
        rowKey={(r) => r.id}
      />
    </div>
  );
}
