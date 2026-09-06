"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, Printer, Download, FilePlus } from "lucide-react";
import { CustomerPicker } from "@/components/invoice/CustomerPicker";
import { ProductSearchAdd } from "@/components/invoice/ProductSearchAdd";
import { Button, Input, Select } from "@/components/common";
import { toast } from "@/lib/toast-store";
import { computeInvoiceTotals } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import type { Product } from "@/types/product";
import type { Customer } from "@/types/party";

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  unitLabel: string;
  availableStock: number;
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
}

interface SplitRow {
  method: "CASH" | "UPI" | "CARD" | "BANK";
  amount: number;
}

interface BusinessInfo {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  state: string | null;
  termsText: string | null;
}

interface SavedSaleItem {
  productName: string;
  quantity: number;
  rate: number;
  gstRate: number;
  total: number;
}

interface SavedSale {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customer: { name: string; mobile: string; address: string | null; gstin: string | null } | null;
  items: SavedSaleItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
}

const PAYMENT_METHODS: SplitRow["method"][] = ["CASH", "UPI", "CARD", "BANK"];

export default function NewInvoicePage() {
  useDocumentTitle("New Invoice");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);

  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [singleMethod, setSingleMethod] = useState<SplitRow["method"]>("CASH");
  const [singleAmount, setSingleAmount] = useState<number | null>(null);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([{ method: "CASH", amount: 0 }]);

  const [saving, setSaving] = useState(false);
  const [savedSale, setSavedSale] = useState<SavedSale | null>(null);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then(setBusiness);
  }, []);

  const isInterstate = Boolean(
    business?.state && customer?.state && business.state.toLowerCase() !== customer.state.toLowerCase()
  );

  const totals = useMemo(
    () => computeInvoiceTotals(cart.map((i) => ({ quantity: i.quantity, rate: i.rate, discount: i.discount, gstRate: i.gstRate })), isInterstate),
    [cart, isInterstate]
  );

  const paidAmount =
    paymentMode === "SINGLE" ? singleAmount ?? totals.grandTotal : splitRows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const dueAmount = Math.max(0, totals.grandTotal - paidAmount);

  function addProduct(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          unitLabel: p.unit.shortName || p.unit.name,
          availableStock: p.currentStock,
          quantity: 1,
          rate: p.sellingPrice,
          discount: 0,
          gstRate: p.gstRate,
        },
      ];
    });
  }

  function updateItem(productId: number, patch: Partial<CartItem>) {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  function resetForm() {
    setCustomer(null);
    setCart([]);
    setPaymentMode("SINGLE");
    setSingleMethod("CASH");
    setSingleAmount(null);
    setSplitRows([{ method: "CASH", amount: 0 }]);
    setSavedSale(null);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave() {
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

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceDate: new Date(invoiceDate).toISOString(),
        customerId: customer?.id ?? null,
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
      toast.error(data.error ?? "Failed to save invoice.");
      return;
    }
    toast.success(`Invoice ${data.invoiceNumber} created.`);
    setSavedSale(data);
  }

  function handleDownloadPdf() {
    if (!savedSale) return;
    generateInvoicePdf({
      invoiceNumber: savedSale.invoiceNumber,
      invoiceDate: savedSale.invoiceDate,
      business,
      customer: savedSale.customer,
      items: savedSale.items,
      subtotal: savedSale.subtotal,
      discount: savedSale.discount,
      cgst: savedSale.cgst,
      sgst: savedSale.sgst,
      igst: savedSale.igst,
      grandTotal: savedSale.grandTotal,
      paidAmount: savedSale.paidAmount,
      dueAmount: savedSale.dueAmount,
      paymentStatus: savedSale.paymentStatus,
    });
  }

  if (savedSale) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <FilePlus className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Invoice {savedSale.invoiceNumber} Created</h1>
        <p className="text-sm text-slate-500">Grand Total: {formatCurrency(savedSale.grandTotal)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Link href="/sales/invoices">
            <Button variant="outline">View Sales History</Button>
          </Link>
          <Button onClick={resetForm}>
            <FilePlus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Create New Invoice</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">Date:</span>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
      </div>

      <div data-tour="tour-customer-picker" className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">Customer</p>
        <CustomerPicker customer={customer} onSelect={setCustomer} />
      </div>

      <div data-tour="tour-product-search" className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">Products</p>
        <ProductSearchAdd onAdd={addProduct} />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Price</th>
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
                      <p className="text-xs text-slate-400">
                        {item.sku} · Stock: {item.availableStock}
                      </p>
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
        <div data-tour="tour-payment-section" className="rounded-lg border border-slate-200 bg-white p-4">
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
                label="Amount Received (leave 0 for full credit)"
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
                  <button
                    onClick={() => setSplitRows((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSplitRows((prev) => [...prev, { method: "CASH", amount: 0 }])}
              >
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
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label="Discount" value={totals.discount} negative />
            <Row label="Taxable Amount" value={totals.taxableAmount} />
            {isInterstate ? (
              <Row label="IGST" value={totals.igst} />
            ) : (
              <>
                <Row label="CGST" value={totals.cgst} />
                <Row label="SGST" value={totals.sgst} />
              </>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          <Button className="mt-4 w-full" size="lg" loading={saving} onClick={handleSave}>
            Save Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>
        {negative ? "-" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
