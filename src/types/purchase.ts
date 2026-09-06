export interface PurchaseItemInput {
  productId: number;
  productName: string;
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
}

export interface CreatePurchasePayload {
  purchaseDate: string;
  supplierId: number;
  supplierInvoiceNumber?: string;
  items: PurchaseItemInput[];
  payments: { method: "CASH" | "UPI" | "CARD" | "BANK"; amount: number }[];
}
