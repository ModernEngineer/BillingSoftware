"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/types/product";

export function ProductSearchAdd({ onAdd }: { onAdd: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = products.filter((p) => {
    if (!p.status) return false;
    const q = query.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search Product / SKU / Barcode to add"
          className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {open && query && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onAdd(p);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span>
                <span className="font-medium text-slate-800">{p.name}</span>
                <span className="ml-2 text-xs text-slate-500">{p.sku}</span>
              </span>
              <span className="text-xs text-slate-500">
                Stock: {p.currentStock} · ₹{p.sellingPrice}
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No products found.</p>}
        </div>
      )}
    </div>
  );
}
