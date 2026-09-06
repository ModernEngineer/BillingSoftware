export interface StockRow {
  id: number;
  name: string;
  sku: string;
  unit: { name: string; shortName: string | null };
  category: { name: string } | null;
  stockValue: number;
  openingStock: number;
  purchase: number;
  sales: number;
  saleReturn: number;
  purchaseReturn: number;
  adjustment: number;
  currentStock: number;
  minimumStock: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface StockTransactionRow {
  id: number;
  date: string;
  type: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  note: string | null;
  product: { name: string; sku: string };
  createdBy: { name: string };
  createdAt: string;
}
