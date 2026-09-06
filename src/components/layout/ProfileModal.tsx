"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { Button, Input } from "@/components/common";
import { toast } from "@/lib/toast-store";

interface ProfileData {
  name: string;
  email: string;
  mobile: string | null;
}

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setMobile(data.mobile ?? "");
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSave() {
    if (!currentPassword) {
      toast.error("Enter your current password to save changes.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        mobile,
        currentPassword,
        ...(newPassword ? { newPassword } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Failed to update profile.");
      return;
    }
    toast.success("Profile updated.");
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="My Profile" size="sm">
      {loading || !profile ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />

          <div className="mt-2 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-medium uppercase text-slate-400">Change Password (optional)</p>
            <div className="flex flex-col gap-3">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              {newPassword && (
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
            </div>
          </div>

          <Input
            label="Current Password *"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required to save any change"
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
