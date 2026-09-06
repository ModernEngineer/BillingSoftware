"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { CustomerFormModal } from "@/components/party/CustomerFormModal";
import type { Customer } from "@/types/party";

export function CustomerPicker({
  customer,
  onSelect,
}: {
  customer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
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

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.gstin ?? "").toLowerCase().includes(q)
    );
  });

  async function handleCreate(payload: Record<string, unknown>) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const created = await res.json();
    setCustomers((prev) => [...prev, created]);
    onSelect(created);
    return true;
  }

  if (customer) {
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-slate-800">{customer.name}</p>
          <p className="text-xs text-slate-500">
            {customer.mobile}
            {customer.gstin ? ` · ${customer.gstin}` : ""}
            {typeof customer.due === "number" && customer.due > 0 ? ` · Due: ₹${customer.due}` : ""}
          </p>
        </div>
        <button onClick={() => onSelect(null)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customer by name, mobile, GSTIN (optional — walk-in allowed)"
          className="h-9 w-full rounded-md border border-slate-300 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          <button
            onClick={() => {
              setAddModalOpen(true);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" /> Add New Customer
          </button>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-800">{c.name}</span>
              <span className="ml-2 text-xs text-slate-500">{c.mobile}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No customers found.</p>}
        </div>
      )}

      <CustomerFormModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleCreate} />
    </div>
  );
}
