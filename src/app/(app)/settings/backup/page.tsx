"use client";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/common";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "@/lib/toast-store";

export default function BackupPage() {
  useDocumentTitle("Backup & Restore");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setConfirmOpen(true);
    }
  }

  async function handleRestore() {
    if (!pendingFile) return;
    setRestoring(true);
    try {
      const text = await pendingFile.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/settings/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Restore failed.");
        return;
      }
      toast.success("Backup restored successfully. Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Invalid backup file.");
    } finally {
      setRestoring(false);
      setConfirmOpen(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900">Backup &amp; Restore</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Create &amp; Download Backup</h2>
        <p className="mb-3 text-sm text-slate-500">
          Download a complete snapshot of your data (products, customers, sales, purchases, payments, etc.) as a JSON file.
        </p>
        <a
          href="/api/settings/backup/export"
          download
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" /> Download Backup
        </a>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Restore Backup</h2>
        <p className="mb-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          This replaces ALL current data with the contents of the backup file. This cannot be undone.
        </p>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelected} className="hidden" />
        <Button variant="danger" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload &amp; Restore Backup
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Automatic Backup</h2>
        <p className="text-sm text-slate-500">
          Scheduled automatic backups (daily/weekly/monthly) require a server-side job scheduler and are not available in
          this environment. Use manual downloads regularly in the meantime.
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Restore"
        description={`This will permanently delete all current data and replace it with the contents of "${pendingFile?.name}". This action cannot be undone.`}
        confirmLabel="Restore"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    </div>
  );
}
