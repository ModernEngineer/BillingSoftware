"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button, Input, Select } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { toast } from "@/lib/toast-store";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductionOrderRow {
  id: number;
  orderNumber: string;
  quantity: number;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  product: { name: string; sku: string };
  createdBy: { name: string };
}

const STATUS_TONE: Record<string, "slate" | "blue" | "green" | "red"> = {
  PLANNED: "slate",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export default function ProductionOrdersPage() {
  useDocumentTitle("Production Orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<ProductionOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/manufacturing/production-orders")
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    if (!productId || quantity <= 0) {
      toast.error("Select a product and enter a valid quantity.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/manufacturing/production-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: Number(productId), quantity }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create production order.");
      return;
    }
    toast.success(`Production order ${data.orderNumber} created.`);
    setProductId("");
    setQuantity(1);
    refresh();
  }

  async function handleComplete(id: number) {
    const res = await fetch(`/api/manufacturing/production-orders/${id}/complete`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to complete production order.");
      return;
    }
    toast.success("Production order completed. Stock updated.");
    refresh();
  }

  const columns: Column<ProductionOrderRow>[] = [
    { key: "orderNumber", header: "Order No" },
    { key: "product", header: "Product", render: (r) => r.product.name, exportValue: (r) => r.product.name },
    { key: "quantity", header: "Quantity" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
      exportValue: (r) => r.status,
    },
    { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt), exportValue: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h1 className="mb-3 text-lg font-bold text-slate-900">New Production Order</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Input label="Quantity to Produce" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <div className="flex items-end">
            <Button onClick={handleCreate} loading={saving} className="w-full">
              Create Order
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        title="Production Orders"
        columns={columns}
        data={rows}
        loading={loading}
        searchKeys={["orderNumber"]}
        exportFilename="production-orders"
        rowKey={(r) => r.id}
        rowActions={(row) =>
          row.status !== "COMPLETED" ? (
            <Button size="sm" variant="outline" onClick={() => handleComplete(row.id)}>
              <CheckCircle2 className="h-4 w-4" /> Complete
            </Button>
          ) : null
        }
      />
    </div>
  );
}
