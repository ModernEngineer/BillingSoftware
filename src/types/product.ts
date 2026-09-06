export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: number | null;
  brandId: number | null;
  unitId: number;
  hsnCode: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number | null;
  gstRate: number;
  openingStock: number;
  minimumStock: number;
  maximumStock: number | null;
  description: string | null;
  image: string | null;
  status: boolean;
  category: { id: number; name: string } | null;
  unit: { id: number; name: string; shortName: string | null };
  brand: { id: number; name: string } | null;
  currentStock: number;
}
