import type { Metadata } from "next";
import { ProductForm } from "@/components/product/ProductForm";

export const metadata: Metadata = { title: "Add Product" };

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Add Product</h1>
      <ProductForm />
    </div>
  );
}
