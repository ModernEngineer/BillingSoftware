"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Select } from "@/components/common";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";

interface RoleData {
  id: number;
  name: string;
  userCount: number;
  permissions: Record<string, string[]>;
}

export default function RolesPage() {
  useDocumentTitle("Roles & Permissions");
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(refresh, []);

  function refresh() {
    setLoading(true);
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data: RoleData[]) => {
        setRoles(data);
        setSelectedRoleId((prev) => prev ?? data[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Roles &amp; Permissions</h1>
        <Select value={selectedRoleId ?? ""} onChange={(e) => setSelectedRoleId(Number(e.target.value))} className="w-56">
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.userCount} users)
            </option>
          ))}
        </Select>
      </div>

      {!loading && selectedRole && (
        <PermissionMatrix key={selectedRole.id} roleId={selectedRole.id} initialPermissions={selectedRole.permissions} onSaved={refresh} />
      )}
    </div>
  );
}
