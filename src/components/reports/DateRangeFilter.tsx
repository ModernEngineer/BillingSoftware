"use client";

import { Button } from "@/components/common/Button";

export interface DateRange {
  from: string;
  to: string;
}

function monthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function yearStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const DEFAULT_RANGE: DateRange = { from: monthStart(), to: today() };

export function DateRangeFilter({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  const presets: { label: string; range: DateRange }[] = [
    { label: "Today", range: { from: today(), to: today() } },
    { label: "7 Days", range: { from: daysAgo(6), to: today() } },
    { label: "30 Days", range: { from: daysAgo(29), to: today() } },
    { label: "This Month", range: { from: monthStart(), to: today() } },
    { label: "This Year", range: { from: yearStart(), to: today() } },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button key={p.label} variant="outline" size="sm" onClick={() => onChange(p.range)}>
          {p.label}
        </Button>
      ))}
      <input
        type="date"
        value={range.from}
        onChange={(e) => onChange({ ...range, from: e.target.value })}
        className="h-8 rounded-md border border-slate-300 px-2 text-sm"
      />
      <span className="text-sm text-slate-400">to</span>
      <input
        type="date"
        value={range.to}
        onChange={(e) => onChange({ ...range, to: e.target.value })}
        className="h-8 rounded-md border border-slate-300 px-2 text-sm"
      />
    </div>
  );
}
