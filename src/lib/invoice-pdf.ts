import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { amountInWords } from "@/lib/gst";

interface InvoiceItem {
  productName: string;
  quantity: number;
  rate: number;
  gstRate: number;
  total: number;
}

interface InvoicePdfInput {
  invoiceNumber: string;
  invoiceDate: string | Date;
  business: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    termsText?: string | null;
  } | null;
  customer?: { name: string; mobile: string; address?: string | null; gstin?: string | null } | null;
  items: InvoiceItem[];
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

export function generateInvoicePdf(data: InvoicePdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.business?.name ?? "Business", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.business?.address) {
    doc.text(data.business.address, pageWidth / 2, y, { align: "center" });
    y += 4;
  }
  const contactLine = [data.business?.phone, data.business?.email].filter(Boolean).join(" · ");
  if (contactLine) {
    doc.text(contactLine, pageWidth / 2, y, { align: "center" });
    y += 4;
  }
  if (data.business?.gstin) {
    doc.text(`GSTIN: ${data.business.gstin}`, pageWidth / 2, y, { align: "center" });
    y += 4;
  }

  y += 3;
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No: ${data.invoiceNumber}`, 14, y);
  doc.text(`Date: ${formatDate(data.invoiceDate)}`, pageWidth - 14, y, { align: "right" });
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  if (data.customer) {
    doc.text(data.customer.name, 14, y);
    y += 4.5;
    doc.text(data.customer.mobile, 14, y);
    y += 4.5;
    if (data.customer.address) {
      doc.text(data.customer.address, 14, y);
      y += 4.5;
    }
    if (data.customer.gstin) {
      doc.text(`GSTIN: ${data.customer.gstin}`, 14, y);
      y += 4.5;
    }
  } else {
    doc.text("Walk-in Customer", 14, y);
    y += 4.5;
  }

  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Rate", "GST %", "Amount"]],
    body: data.items.map((i) => [
      i.productName,
      String(i.quantity),
      formatCurrency(i.rate),
      `${i.gstRate}%`,
      formatCurrency(i.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 6;

  const totalsX = pageWidth - 70;
  function totalRow(label: string, value: number, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX, finalY);
    doc.text(formatCurrency(value), pageWidth - 14, finalY, { align: "right" });
    finalY += 5;
  }

  doc.setFontSize(9);
  totalRow("Subtotal", data.subtotal);
  if (data.discount) totalRow("Discount", -data.discount);
  if (data.cgst) totalRow("CGST", data.cgst);
  if (data.sgst) totalRow("SGST", data.sgst);
  if (data.igst) totalRow("IGST", data.igst);
  totalRow("Grand Total", data.grandTotal, true);
  totalRow("Paid", data.paidAmount);
  totalRow("Due", data.dueAmount, true);

  finalY += 3;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text(`Amount in Words: ${amountInWords(data.grandTotal)}`, 14, finalY);
  finalY += 6;

  doc.setFont("helvetica", "bold");
  doc.text(`Payment Status: ${data.paymentStatus}`, 14, finalY);
  finalY += 8;

  if (data.business?.termsText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Terms & Conditions:", 14, finalY);
    finalY += 4;
    doc.text(data.business.termsText, 14, finalY, { maxWidth: pageWidth - 28 });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Authorized Signature", pageWidth - 14, 280, { align: "right" });

  doc.save(`${data.invoiceNumber}.pdf`);
}
