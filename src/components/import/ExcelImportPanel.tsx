"use client";

import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { exportToExcel, readExcelFile } from "@/lib/excel";
import { toast } from "@/lib/toast-store";

interface ExcelImportPanelProps {
  title: string;
  templateColumns: string[];
  sampleRow?: Record<string, string | number>;
  requiredColumns: string[];
  importEndpoint: string;
  templateFilename: string;
}

interface ParsedRow {
  data: Record<string, unknown>;
  errors: string[];
}

export function ExcelImportPanel({
  title,
  templateColumns,
  sampleRow,
  requiredColumns,
  importEndpoint,
  templateFilename,
}: ExcelImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; message: string }[] } | null>(null);

  function handleDownloadTemplate() {
    const sample: Record<string, string | number> = sampleRow ?? Object.fromEntries(templateColumns.map((c) => [c, ""]));
    exportToExcel(templateFilename, [sample]);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const parsed = await readExcelFile(file);
      const withValidation = parsed.map((row) => {
        const errors: string[] = [];
        for (const col of requiredColumns) {
          if (!row[col] || String(row[col]).trim() === "") {
            errors.push(`${col} is required`);
          }
        }
        return { data: row, errors };
      });
      setRows(withValidation);
    } catch {
      toast.error("Failed to read Excel file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  async function handleImport(onlyValid: boolean) {
    const toImport = onlyValid ? validRows : rows;
    if (toImport.length === 0) {
      toast.error("No records to import.");
      return;
    }
    setImporting(true);
    const res = await fetch(importEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: toImport.map((r) => r.data) }),
    });
    const data = await res.json().catch(() => ({}));
    setImporting(false);
    if (!res.ok) {
      toast.error(data.error ?? "Import failed.");
      return;
    }
    setResult(data);
    setRows([]);
    toast.success(`${data.inserted} record(s) imported.`);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mb-3 text-sm text-slate-500">Columns: {templateColumns.join(", ")}</p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4" /> Download Template
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload Excel
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-3 text-sm">
            <Badge tone="green">{validRows.length} valid</Badge>
            {invalidRows.length > 0 && <Badge tone="red">{invalidRows.length} invalid</Badge>}
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-2 py-1.5">Row</th>
                  {templateColumns.map((c) => (
                    <th key={c} className="px-2 py-1.5">
                      {c}
                    </th>
                  ))}
                  <th className="px-2 py-1.5">Errors</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className={row.errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="px-2 py-1.5">{idx + 2}</td>
                    {templateColumns.map((c) => (
                      <td key={c} className="px-2 py-1.5">
                        {String(row.data[c] ?? "")}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-red-600">{row.errors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleImport(true)} loading={importing} disabled={validRows.length === 0}>
              Import Valid Records ({validRows.length})
            </Button>
            {invalidRows.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => handleImport(false)} loading={importing}>
                Import All (server will re-validate)
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 flex flex-col gap-2 rounded-md bg-slate-50 p-3 text-sm">
          <p className="flex items-center gap-1.5 text-green-700">
            <CheckCircle2 className="h-4 w-4" /> {result.inserted} record(s) imported successfully.
          </p>
          {result.errors.length > 0 && (
            <div className="text-red-600">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-4 w-4" /> {result.errors.length} row(s) failed:
              </p>
              <ul className="ml-6 list-disc">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
