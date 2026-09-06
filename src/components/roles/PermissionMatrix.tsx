"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { toast } from "@/lib/toast-store";
import { MODULES, ACTIONS } from "@/constants/permissions";

export function PermissionMatrix({
  roleId,
  initialPermissions,
  onSaved,
}: {
  roleId: number;
  initialPermissions: Record<string, string[]>;
  onSaved: () => void;
}) {
  // Remounted by the parent via `key={roleId}`, so this lazy initializer
  // always starts from the right role's permissions without needing an effect.
  const [matrix, setMatrix] = useState(() => ({ ...initialPermissions }));
  const [saving, setSaving] = useState(false);

  function toggle(module: string, action: string) {
    setMatrix((prev) => {
      const current = new Set(prev[module] ?? []);
      if (current.has(action)) current.delete(action);
      else current.add(action);
      return { ...prev, [module]: Array.from(current) };
    });
  }

  function toggleRow(module: string) {
    setMatrix((prev) => {
      const current = prev[module] ?? [];
      const allSelected = current.length === ACTIONS.length;
      return { ...prev, [module]: allSelected ? [] : [...ACTIONS] };
    });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: matrix }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save permissions.");
      return;
    }
    toast.success("Permissions updated.");
    onSaved();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2.5">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-4 py-2.5 text-center">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) => (
              <tr key={module} className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">
                  <button onClick={() => toggleRow(module)} className="hover:underline">
                    {module}
                  </button>
                </td>
                {ACTIONS.map((action) => (
                  <td key={action} className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(matrix[module]?.includes(action))}
                      onChange={() => toggle(module, action)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Save Permissions
        </Button>
      </div>
    </div>
  );
}
