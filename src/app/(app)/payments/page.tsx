"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button, Input, Select } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { toast } from "@/lib/toast-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, Supplier } from "@/types/party";

interface DueSale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  grandTotal: number;
  dueAmount: number;
}

interface DuePurchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  grandTotal: number;
  dueAmount: number;
}

interface PaymentRow {
  id: number;
  paymentNumber: string;
  direction: string;
  date: string;
  amount: number;
  method: string;
  customer: { name: string } | null;
  supplier: { name: string } | null;
  sale: { invoiceNumber: string } | null;
  purchase: { purchaseNumber: string } | null;
}

const METHODS = ["CASH", "UPI", "CARD", "BANK"];

export default function PaymentsPage() {
  useDocumentTitle("Payments");
  const [tab, setTab] = useState<"RECEIVE" | "PAY">("RECEIVE");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<DueSale[]>([]);
  const [purchases, setPurchases] = useState<DuePurchase[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [partyId, setPartyId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState(METHODS[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/sales").then((r) => r.json()).then(setSales);
    fetch("/api/purchases").then((r) => r.json()).then(setPurchases);
    refreshPayments();
  }, []);

  function refreshPayments() {
    setLoadingPayments(true);
    fetch("/api/payments")
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoadingPayments(false));
  }

  function resetForm() {
    setPartyId("");
    setInvoiceId("");
    setAmount(0);
    setReferenceNo("");
    setNotes("");
  }

  const dueInvoices =
    tab === "RECEIVE"
      ? sales.filter((s) => s.customerId === Number(partyId) && s.dueAmount > 0)
      : purchases.filter((p) => p.supplierId === Number(partyId) && p.dueAmount > 0);

  async function handleSave() {
    if (!partyId || !invoiceId || amount <= 0) {
      toast.error("Select a party, an invoice, and enter a valid amount.");
      return;
    }
    setSaving(true);
    const endpoint = tab === "RECEIVE" ? "/api/payments/receive" : "/api/payments/pay";
    const payload =
      tab === "RECEIVE"
        ? { customerId: Number(partyId), saleId: Number(invoiceId), amount, method, date: new Date(date).toISOString(), referenceNo, notes }
        : { supplierId: Number(partyId), purchaseId: Number(invoiceId), amount, method, date: new Date(date).toISOString(), referenceNo, notes };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save payment.");
      return;
    }
    toast.success(`Payment ${data.paymentNumber} recorded.`);
    resetForm();
    refreshPayments();
    fetch("/api/sales").then((r) => r.json()).then(setSales);
    fetch("/api/purchases").then((r) => r.json()).then(setPurchases);
  }

  const columns: Column<PaymentRow>[] = [
    { key: "paymentNumber", header: "Payment No", sortable: true },
    { key: "date", header: "Date", render: (r) => formatDate(r.date), exportValue: (r) => formatDate(r.date) },
    {
      key: "direction",
      header: "Type",
      render: (r) => <Badge tone={r.direction === "RECEIVE" ? "green" : "red"}>{r.direction === "RECEIVE" ? "Received" : "Paid"}</Badge>,
      exportValue: (r) => r.direction,
    },
    {
      key: "party",
      header: "Party",
      render: (r) => r.customer?.name ?? r.supplier?.name ?? "-",
      exportValue: (r) => r.customer?.name ?? r.supplier?.name ?? "",
    },
    {
      key: "reference",
      header: "Reference",
      render: (r) => r.sale?.invoiceNumber ?? r.purchase?.purchaseNumber ?? "-",
      exportValue: (r) => r.sale?.invoiceNumber ?? r.purchase?.purchaseNumber ?? "",
    },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount), exportValue: (r) => r.amount },
    { key: "method", header: "Method" },
  ];

  return (
    <div data-tour="tour-payments" className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex gap-2">
          <Button variant={tab === "RECEIVE" ? "primary" : "outline"} onClick={() => { setTab("RECEIVE"); resetForm(); }}>
            Receive Payment
          </Button>
          <Button variant={tab === "PAY" ? "primary" : "outline"} onClick={() => { setTab("PAY"); resetForm(); }}>
            Pay Supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label={tab === "RECEIVE" ? "Customer" : "Supplier"}
            value={partyId}
            onChange={(e) => {
              setPartyId(e.target.value);
              setInvoiceId("");
            }}
          >
            <option value="">Select {tab === "RECEIVE" ? "customer" : "supplier"}</option>
            {(tab === "RECEIVE" ? customers : suppliers).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select label={tab === "RECEIVE" ? "Invoice" : "Purchase"} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">Select {tab === "RECEIVE" ? "invoice" : "purchase"}</option>
            {dueInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {"invoiceNumber" in inv ? inv.invoiceNumber : inv.purchaseNumber} — Due: {formatCurrency(inv.dueAmount)}
              </option>
            ))}
          </Select>

          <Input label="Amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Reference No" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
        </div>
        <div className="mt-3">
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Payment
          </Button>
        </div>
      </div>

      <DataTable
        title="Payment History"
        columns={columns}
        data={payments}
        loading={loadingPayments}
        searchKeys={["paymentNumber"]}
        exportFilename="payments"
        rowKey={(r) => r.id}
      />
    </div>
  );
}
