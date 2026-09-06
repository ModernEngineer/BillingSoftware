import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiGet } from "@/lib/serverApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LedgerActions } from "@/components/party/LedgerActions";

interface SupplierLedgerResponse {
  supplier: {
    name: string;
    mobile: string;
    gstin: string | null;
    address: string | null;
    openingBalance: number;
  };
  ledger: { date: string; type: string; reference: string; debit: number; credit: number; balance: number }[];
  totals: { totalPurchase: number; totalPaid: number; totalDue: number };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await serverApiGet<SupplierLedgerResponse>(`/api/suppliers/${id}/ledger`);
  return { title: data ? `${data.supplier.name} — Ledger` : "Supplier Ledger" };
}

export default async function SupplierLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverApiGet<SupplierLedgerResponse>(`/api/suppliers/${id}/ledger`);
  if (!data) notFound();

  const { supplier, ledger, totals } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="app-chrome flex items-center justify-between">
        <Link href="/suppliers" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to Suppliers
        </Link>
        <LedgerActions />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{supplier.name}</h1>
            <p className="text-sm text-slate-500">{supplier.mobile}</p>
            {supplier.gstin && <p className="text-sm text-slate-500">GSTIN: {supplier.gstin}</p>}
            {supplier.address && <p className="text-sm text-slate-500">{supplier.address}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-xs text-slate-500">Total Purchase</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(totals.totalPurchase)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Due</p>
              <p className="text-base font-bold text-red-600">{formatCurrency(totals.totalDue)}</p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2 text-slate-500" colSpan={5}>
                Opening Balance
              </td>
              <td className="px-3 py-2 text-right font-medium">{formatCurrency(supplier.openingBalance)}</td>
            </tr>
            {ledger.map((entry, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="px-3 py-2">{formatDate(entry.date)}</td>
                <td className="px-3 py-2">{entry.type}</td>
                <td className="px-3 py-2">{entry.reference}</td>
                <td className="px-3 py-2 text-right">{entry.debit ? formatCurrency(entry.debit) : "-"}</td>
                <td className="px-3 py-2 text-right">{entry.credit ? formatCurrency(entry.credit) : "-"}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(entry.balance)}</td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
