"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Input, Select } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { toast } from "@/lib/toast-store";
import { formatDate } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

interface Activity {
  id: number;
  note: string;
  nextFollowUpDate: string | null;
  createdAt: string;
  createdBy: { name: string };
}

interface LeadDetail {
  id: number;
  name: string;
  mobile: string | null;
  email: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  activities: Activity[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  useDocumentTitle(lead ? `Lead — ${lead.name}` : "Lead Details");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);

  function refresh() {
    setLoading(true);
    fetch(`/api/crm/leads/${id}`)
      .then((r) => r.json())
      .then(setLead)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [id]);

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Status updated.");
      refresh();
    }
  }

  async function handleAddActivity() {
    if (!note.trim()) {
      toast.error("Enter a note.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/crm/leads/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, nextFollowUpDate: nextFollowUpDate || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to add follow-up.");
      return;
    }
    setNote("");
    setNextFollowUpDate("");
    toast.success("Follow-up added.");
    refresh();
  }

  if (loading || !lead) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/crm/leads" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{lead.name}</h1>
            <p className="text-sm text-slate-500">{lead.mobile}</p>
            <p className="text-sm text-slate-500">{lead.email}</p>
            {lead.source && <p className="text-sm text-slate-500">Source: {lead.source}</p>}
          </div>
          <Select value={lead.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-40">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Add Follow-up</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Follow-up note..." value={note} onChange={(e) => setNote(e.target.value)} className="flex-1" />
          <Input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} className="sm:w-48" />
          <Button onClick={handleAddActivity} loading={saving}>
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Activity Timeline</h2>
        <div className="flex flex-col gap-3">
          {lead.activities.length === 0 && <p className="text-sm text-slate-400">No follow-ups recorded yet.</p>}
          {lead.activities.map((a) => (
            <div key={a.id} className="border-l-2 border-blue-200 pl-3">
              <p className="text-sm text-slate-700">{a.note}</p>
              <p className="text-xs text-slate-400">
                {formatDate(a.createdAt)} by {a.createdBy.name}
                {a.nextFollowUpDate && (
                  <>
                    {" · "}
                    <Badge tone="yellow">Next: {formatDate(a.nextFollowUpDate)}</Badge>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
