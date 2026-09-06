export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  openingBalance: number;
  creditLimit: number | null;
  paymentTerms: string | null;
  notes: string | null;
  status: boolean;
  totalSales?: number;
  paid?: number;
  due?: number;
}

export interface Supplier {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  openingBalance: number;
  creditLimit: number | null;
  notes: string | null;
  status: boolean;
  totalPurchase?: number;
  paid?: number;
  due?: number;
}
