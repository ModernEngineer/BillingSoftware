"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, Ban } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { toast } from "@/lib/toast-store";

interface InvoiceViewActionsProps {
  sale: {
    id: number;
    invoiceNumber: string;
    invoiceDate: string | Date;
    subtotal: number;
    discount: number;
    cgst: number;
    sgst: number;
    igst: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    status: string;
    customer: { name: string; mobile: string; address: string | null; gstin: string | null } | null;
    items: { productName: string; quantity: number; rate: number; gstRate: number; total: number }[];
  };
  business: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    termsText: string | null;
  } | null;
}

export function InvoiceViewActions({ sale, business }: InvoiceViewActionsProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDownloadPdf() {
    generateInvoicePdf({
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate,
      business,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      cgst: sale.cgst,
      sgst: sale.sgst,
      igst: sale.igst,
      grandTotal: sale.grandTotal,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      paymentStatus: sale.paymentStatus,
    });
  }

  async function handleCancel() {
    if (!reason.trim()) {
      toast.error("Cancellation reason is required.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/sales/${sale.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to cancel invoice.");
      return;
    }
    toast.success("Invoice cancelled.");
    setCancelOpen(false);
    router.refresh();
  }

  return (
    <div className="app-chrome flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
        <Download className="h-4 w-4" /> Download PDF
      </Button>
      {sale.status !== "CANCELLED" && (
        <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
          <Ban className="h-4 w-4" /> Cancel Invoice
        </Button>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Invoice" size="sm">
        <p className="mb-3 text-sm text-slate-600">
          Are you sure you want to cancel invoice {sale.invoiceNumber}? Stock will be restored.
        </p>
        <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCancelOpen(false)}>
            Close
          </Button>
          <Button variant="danger" loading={loading} onClick={handleCancel}>
            Confirm Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
