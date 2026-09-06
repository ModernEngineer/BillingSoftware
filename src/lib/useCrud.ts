"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast-store";

export function useCrud<T extends { id: number }>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  async function create(payload: Partial<T>): Promise<boolean> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create record.");
      return false;
    }
    toast.success("Created successfully.");
    await refresh();
    return true;
  }

  async function update(id: number, payload: Partial<T>): Promise<boolean> {
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update record.");
      return false;
    }
    toast.success("Updated successfully.");
    await refresh();
    return true;
  }

  async function remove(id: number): Promise<boolean> {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to delete record.");
      return false;
    }
    toast.success("Deleted successfully.");
    await refresh();
    return true;
  }

  return { items, loading, refresh, create, update, remove };
}
