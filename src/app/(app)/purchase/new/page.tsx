"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SupplierPicker } from "@/components/invoice/SupplierPicker";
import { ProductSearchAdd } from "@/components/invoice/ProductSearchAdd";
import { Button, Input, Select } from "@/components/common";
import { toast } from "@/lib/toast-store";
import { computeInvoiceTotals } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Supplier } from "@/types/party";

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
}

interface SplitRow {
  method: "CASH" | "UPI" | "CARD" | "BANK";
  amount: number;
}

const PAYMENT_METHODS: SplitRow["method"][] = ["CASH", "UPI", "CARD", "BANK"];

export default function NewPurchasePage() {
  useDocumentTitle("New Purchase");
  const router = useRouter();
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [singleMethod, setSingleMethod] = useState<SplitRow["method"]>("CASH");
  const [singleAmount, setSingleAmount] = useState<number | null>(null);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([{ method: "CASH", amount: 0 }]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () => computeInvoiceTotals(cart.map((i) => ({ quantity: i.quantity, rate: i.rate, discount: i.discount, gstRate: i.gstRate })), false),
    [cart]
  );

  const paidAmount =
    paymentMode === "SINGLE" ? singleAmount ?? totals.grandTotal : splitRows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const dueAmount = Math.max(0, totals.grandTotal - paidAmount);

  function addProduct(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [
        ...prev,
        { productId: p.id, productName: p.name, sku: p.sku, quantity: 1, rate: p.purchasePrice, discount: 0, gstRate: p.gstRate },
      ];
    });
  }

  function updateItem(productId: number, patch: Partial<CartItem>) {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleSave() {
    if (!supplier) {
      toast.error("Select a supplier.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one product.");
      return;
    }
    setSaving(true);
    const payments: SplitRow[] =
      paymentMode === "SINGLE"
        ? (singleAmount ?? totals.grandTotal) > 0
          ? [{ method: singleMethod, amount: singleAmount ?? totals.grandTotal }]
          : []
        : splitRows.filter((r) => r.amount > 0);

    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseDate: new Date(purchaseDate).toISOString(),
        supplierId: supplier.id,
        supplierInvoiceNumber: supplierInvoiceNumber || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          rate: i.rate,
          discount: i.discount,
          gstRate: i.gstRate,
        })),
        payments,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Failed to save purchase.");
      return;
    }
    toast.success(`Purchase ${data.purchaseNumber} recorded. Stock updated.`);
    router.push("/purchase/invoices");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <h1 className="text-lg font-bold text-slate-900">New Purchase</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">Date:</span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div data-tour="tour-supplier-picker" className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Supplier</p>
          <SupplierPicker supplier={supplier} onSelect={setSupplier} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <Input
            label="Supplier Invoice Number"
            value={supplierInvoiceNumber}
            onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">Products</p>
        <ProductSearchAdd onAdd={addProduct} />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Purchase Price</th>
                <th className="py-2 pr-3">Discount</th>
                <th className="py-2 pr-3">GST %</th>
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                const computed = computeInvoiceTotals([item], false).items[0];
                return (
                  <tr key={item.productId} className="border-b border-slate-100">
                    <td className="py-2 pr-3">
                      <p className="font-medium text-slate-800">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.sku}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, { quantity: Number(e.target.value) })}
                        className="h-8 w-20 rounded border border-slate-300 px-2"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.productId, { rate: Number(e.target.value) })}
                        className="h-8 w-24 rounded border border-slate-300 px-2"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.productId, { discount: Number(e.target.value) })}
                        className="h-8 w-20 rounded border border-slate-300 px-2"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={item.gstRate}
                        onChange={(e) => updateItem(item.productId, { gstRate: Number(e.target.value) })}
                        className="h-8 w-20 rounded border border-slate-300 px-2"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">{formatCurrency(computed.total)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Payment</p>
          <div className="mb-3 flex gap-2">
            <Button variant={paymentMode === "SINGLE" ? "primary" : "outline"} size="sm" onClick={() => setPaymentMode("SINGLE")}>
              Single Method
            </Button>
            <Button variant={paymentMode === "SPLIT" ? "primary" : "outline"} size="sm" onClick={() => setPaymentMode("SPLIT")}>
              Split Payment
            </Button>
          </div>

          {paymentMode === "SINGLE" ? (
            <div className="flex flex-col gap-3">
              <Select value={singleMethod} onChange={(e) => setSingleMethod(e.target.value as SplitRow["method"])}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Input
                label="Amount Paid (leave 0 for full credit)"
                type="number"
                min={0}
                step="0.01"
                value={singleAmount ?? totals.grandTotal}
                onChange={(e) => setSingleAmount(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {splitRows.map((row, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select
                    value={row.method}
                    onChange={(e) =>
                      setSplitRows((prev) => prev.map((r, i) => (i === idx ? { ...r, method: e.target.value as SplitRow["method"] } : r)))
                    }
                    className="w-28"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.amount}
                    onChange={(e) =>
                      setSplitRows((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: Number(e.target.value) } : r)))
                    }
                    className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
                  />
                  <button onClick={() => setSplitRows((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setSplitRows((prev) => [...prev, { method: "CASH", amount: 0 }])}>
                + Add Payment Row
              </Button>
            </div>
          )}

          <div className="mt-3 flex justify-between text-sm">
            <span className="text-slate-500">Paid</span>
            <span className="font-medium">{formatCurrency(paidAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Due</span>
            <span className={`font-medium ${dueAmount > 0 ? "text-red-600" : ""}`}>{formatCurrency(dueAmount)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Bill Summary</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount</span>
              <span>{formatCurrency(totals.taxableAmount)}</span>
            </div>
            {totals.cgst > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>CGST</span>
                <span>{formatCurrency(totals.cgst)}</span>
              </div>
            )}
            {totals.sgst > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>SGST</span>
                <span>{formatCurrency(totals.sgst)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          <Button className="mt-4 w-full" size="lg" loading={saving} onClick={handleSave}>
            Save Purchase
          </Button>
        </div>
      </div>
    </div>
  );
}
