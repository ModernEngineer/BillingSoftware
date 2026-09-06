"use client";

import { ReactNode, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, Printer, Search } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeleton";
import { exportToExcel, exportToCSV } from "@/lib/excel";
import { exportTableToPdf } from "@/lib/pdf";

function asRecord<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  exportValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T extends object> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  addButton?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFilename?: string;
  rowKey?: (row: T) => string | number;
}

export function DataTable<T extends object>({
  title,
  columns,
  data,
  loading,
  searchPlaceholder = "Search...",
  searchKeys,
  pageSize = 20,
  addButton,
  rowActions,
  emptyTitle = "No records found.",
  emptyDescription,
  exportFilename = "export",
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    const keys = searchKeys ?? (Object.keys(data[0] ?? {}) as (keyof T)[]);
    return data.filter((row) =>
      keys.some((key) => String(asRecord(row)[key as string] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = asRecord(a)[sortKey];
      const bv = asRecord(b)[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av ?? "").localeCompare(String(bv ?? ""))
        : String(bv ?? "").localeCompare(String(av ?? ""));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  function buildExportRows() {
    return sorted.map((row) => {
      const record: Record<string, string | number> = {};
      for (const col of columns) {
        record[col.header] = col.exportValue ? col.exportValue(row) : String(asRecord(row)[col.key] ?? "");
      }
      return record;
    });
  }

  function handleExportExcel() {
    exportToExcel(exportFilename, buildExportRows());
    setExportOpen(false);
  }

  function handleExportCSV() {
    exportToCSV(exportFilename, buildExportRows());
    setExportOpen(false);
  }

  function handleExportPDF() {
    const rows = sorted.map((row) =>
      columns.map((col) => (col.exportValue ? col.exportValue(row) : String(asRecord(row)[col.key] ?? "")))
    );
    exportTableToPdf(exportFilename, title ?? exportFilename, columns.map((c) => c.header), rows);
    setExportOpen(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
        {addButton}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-md border border-slate-300 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportOpen((v) => !v)}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-10 z-20 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleExportExcel}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                Excel
              </button>
              <button
                onClick={handleExportCSV}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : pageData.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 ${col.sortable ? "cursor-pointer select-none" : ""} ${col.className ?? ""}`}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row) : idx}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 text-slate-700 ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : String(asRecord(row)[col.key] ?? "")}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">{rowActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
