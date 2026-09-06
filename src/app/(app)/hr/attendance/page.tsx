"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useEffect, useState } from "react";
import { Button } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { toast } from "@/lib/toast-store";

interface Employee {
  id: number;
  name: string;
  designation: string | null;
}

interface AttendanceRecord {
  employeeId: number;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY";
}

const STATUS_OPTIONS: AttendanceRecord["status"][] = ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"];
const STATUS_LABEL: Record<string, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave", HALF_DAY: "Half Day" };
const STATUS_TONE: Record<string, "green" | "red" | "yellow" | "blue"> = {
  PRESENT: "green",
  ABSENT: "red",
  LEAVE: "yellow",
  HALF_DAY: "blue",
};

export default function AttendancePage() {
  useDocumentTitle("Attendance");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [marks, setMarks] = useState<Record<number, AttendanceRecord["status"]>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/hr/employees").then((r) => r.json()).then((data) => setEmployees(data.filter((e: { status: boolean }) => e.status)));
  }, []);

  useEffect(() => {
    fetch(`/api/hr/attendance?date=${date}`)
      .then((r) => r.json())
      .then((rows: AttendanceRecord[]) => {
        const map: Record<number, AttendanceRecord["status"]> = {};
        for (const r of rows) map[r.employeeId] = r.status;
        setMarks(map);
      });
  }, [date]);

  async function mark(employeeId: number, status: AttendanceRecord["status"]) {
    setSaving(employeeId);
    const res = await fetch("/api/hr/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date, status }),
    });
    setSaving(null);
    if (res.ok) {
      setMarks((prev) => ({ ...prev, [employeeId]: status }));
      toast.success("Attendance saved.");
    } else {
      toast.error("Failed to save attendance.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Current Status</th>
              <th className="px-4 py-2.5">Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.designation}</p>
                </td>
                <td className="px-4 py-2.5">
                  {marks[emp.id] ? <Badge tone={STATUS_TONE[marks[emp.id]]}>{STATUS_LABEL[marks[emp.id]]}</Badge> : <span className="text-slate-400">Not marked</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={marks[emp.id] === s ? "primary" : "outline"}
                        loading={saving === emp.id}
                        onClick={() => mark(emp.id, s)}
                      >
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No active employees.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
