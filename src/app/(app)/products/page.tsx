"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2, Barcode } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { useCrud } from "@/lib/useCrud";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  useDocumentTitle("Products");
  const { items, loading, remove } = useCrud<Product>("/api/products");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await remove(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const columns: Column<Product>[] = [
    { key: "name", header: "Product Name", sortable: true },
    { key: "sku", header: "SKU", sortable: true },
    { key: "category", header: "Category", render: (r) => r.category?.name ?? "-", exportValue: (r) => r.category?.name ?? "" },
    { key: "brand", header: "Brand", render: (r) => r.brand?.name ?? "-", exportValue: (r) => r.brand?.name ?? "" },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      sortable: true,
      render: (r) => formatCurrency(r.purchasePrice),
      exportValue: (r) => r.purchasePrice,
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      sortable: true,
      render: (r) => formatCurrency(r.sellingPrice),
      exportValue: (r) => r.sellingPrice,
    },
    { key: "gstRate", header: "GST %", render: (r) => `${r.gstRate}%`, exportValue: (r) => r.gstRate },
    {
      key: "currentStock",
      header: "Current Stock",
      sortable: true,
      render: (r) => (
        <span className={r.currentStock <= r.minimumStock ? "font-semibold text-amber-600" : ""}>
          {r.currentStock} {r.unit?.shortName ?? r.unit?.name}
        </span>
      ),
      exportValue: (r) => r.currentStock,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status ? "green" : "slate"}>{r.status ? "Active" : "Inactive"}</Badge>,
      exportValue: (r) => (r.status ? "Active" : "Inactive"),
    },
  ];

  return (
    <div data-tour="tour-add-product" className="flex flex-col gap-4">
      <DataTable
        title="Products"
        columns={columns}
        data={items}
        loading={loading}
        searchKeys={["name", "sku", "barcode"]}
        exportFilename="products"
        rowKey={(r) => r.id}
        addButton={
          <div className="flex gap-2">
            <Link href="/products/units">
              <Button variant="outline">Units</Button>
            </Link>
            <Link href="/products/categories">
              <Button variant="outline">Categories</Button>
            </Link>
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        }
        rowActions={(row) => (
          <>
            <Button variant="ghost" size="sm" title="Barcode">
              <Barcode className="h-4 w-4" />
            </Button>
            <Link href={`/products/${row.id}`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? If it's used in past sales/purchases, it will be deactivated instead.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
