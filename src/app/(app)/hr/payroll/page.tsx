"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button, Select } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { toast } from "@/lib/toast-store";
import { formatCurrency } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PayrollRow {
  id: number;
  month: number;
  year: number;
  basic: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "DRAFT" | "PAID";
  employee: { name: string; designation: string | null };
}

export default function PayrollPage() {
  useDocumentTitle("Payroll");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function refresh() {
    setLoading(true);
    fetch(`/api/hr/payroll?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [month, year]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/hr/payroll/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) {
      toast.error("Failed to generate payroll.");
      return;
    }
    toast.success(`Payroll generated for ${data.created} employee(s).`);
    refresh();
  }

  async function updateRow(id: number, patch: Partial<PayrollRow>) {
    const res = await fetch(`/api/hr/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Payroll updated.");
      refresh();
    }
  }

  const columns: Column<PayrollRow>[] = [
    { key: "employee", header: "Employee", render: (r) => r.employee.name, exportValue: (r) => r.employee.name },
    { key: "basic", header: "Basic", render: (r) => formatCurrency(r.basic), exportValue: (r) => r.basic },
    {
      key: "allowances",
      header: "Allowances",
      render: (r) => (
        <input
          type="number"
          defaultValue={r.allowances}
          className="h-8 w-24 rounded border border-slate-300 px-2"
          onBlur={(e) => updateRow(r.id, { allowances: Number(e.target.value) })}
        />
      ),
      exportValue: (r) => r.allowances,
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (r) => (
        <input
          type="number"
          defaultValue={r.deductions}
          className="h-8 w-24 rounded border border-slate-300 px-2"
          onBlur={(e) => updateRow(r.id, { deductions: Number(e.target.value) })}
        />
      ),
      exportValue: (r) => r.deductions,
    },
    { key: "netPay", header: "Net Pay", render: (r) => formatCurrency(r.netPay), exportValue: (r) => r.netPay },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={r.status === "PAID" ? "green" : "yellow"}>{r.status}</Badge>,
      exportValue: (r) => r.status,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Payroll</h1>
        <div className="flex items-center gap-2">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-36">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24">
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Button onClick={handleGenerate} loading={generating}>
            Generate Payroll
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        exportFilename="payroll"
        rowKey={(r) => r.id}
        rowActions={(row) =>
          row.status === "DRAFT" ? (
            <Button size="sm" variant="outline" onClick={() => updateRow(row.id, { status: "PAID" })}>
              Mark Paid
            </Button>
          ) : null
        }
      />
    </div>
  );
}
