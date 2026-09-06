export interface SaleItemInput {
  productId: number;
  productName: string;
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
}

export interface PaymentInput {
  method: "CASH" | "UPI" | "CARD" | "BANK";
  amount: number;
}

export interface CreateSalePayload {
  invoiceDate: string;
  customerId: number | null;
  items: SaleItemInput[];
  payments: PaymentInput[];
}
