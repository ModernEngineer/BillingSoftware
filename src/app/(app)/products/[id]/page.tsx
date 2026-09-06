import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverApiGet } from "@/lib/serverApi";
import { ProductForm } from "@/components/product/ProductForm";
import type { Product } from "@/types/product";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await serverApiGet<{ name: string }>(`/api/products/${id}`);
  return { title: product ? `Edit ${product.name}` : "Edit Product" };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await serverApiGet<Product>(`/api/products/${id}`);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
