import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiGet } from "@/lib/serverApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";

interface PurchaseDetail {
  purchaseNumber: string;
  purchaseDate: string;
  supplierInvoiceNumber?: string | null;
  supplier: { name: string; mobile: string; gstin: string | null };
  items: { id: number; productName: string; quantity: number; rate: number; gstRate: number; total: number }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const purchase = await serverApiGet<{ purchaseNumber: string }>(`/api/purchases/${id}`);
  return { title: purchase ? purchase.purchaseNumber : "Purchase" };
}

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchase = await serverApiGet<PurchaseDetail>(`/api/purchases/${id}`);
  if (!purchase) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/purchase/invoices" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Purchase History
      </Link>

      <div className="mx-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{purchase.purchaseNumber}</h1>
            <p className="text-sm text-slate-500">{formatDate(purchase.purchaseDate)}</p>
            {purchase.supplierInvoiceNumber && (
              <p className="text-sm text-slate-500">Supplier Invoice: {purchase.supplierInvoiceNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-800">{purchase.supplier.name}</p>
            <p className="text-sm text-slate-500">{purchase.supplier.mobile}</p>
            {purchase.supplier.gstin && <p className="text-sm text-slate-500">GSTIN: {purchase.supplier.gstin}</p>}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">GST %</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.rate)}</td>
                <td className="py-2 text-right">{item.gstRate}%</td>
                <td className="py-2 text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(purchase.subtotal)}</span>
            </div>
            {purchase.cgst > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">CGST</span>
                <span>{formatCurrency(purchase.cgst)}</span>
              </div>
            )}
            {purchase.sgst > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">SGST</span>
                <span>{formatCurrency(purchase.sgst)}</span>
              </div>
            )}
            {purchase.igst > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">IGST</span>
                <span>{formatCurrency(purchase.igst)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(purchase.grandTotal)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-slate-500">
              <span>Paid</span>
              <span>{formatCurrency(purchase.paidAmount)}</span>
            </div>
            <div className="flex justify-between py-0.5 font-medium">
              <span>Due</span>
              <span>{formatCurrency(purchase.dueAmount)}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm font-semibold">
          Payment Status:{" "}
          <Badge tone={purchase.paymentStatus === "PAID" ? "green" : purchase.paymentStatus === "PARTIAL" ? "yellow" : "red"}>
            {purchase.paymentStatus}
          </Badge>
        </p>
      </div>
    </div>
  );
}
