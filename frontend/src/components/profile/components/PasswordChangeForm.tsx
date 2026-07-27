"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordChangeFormProps {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  savingPassword: boolean;
  passwordMsg: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordChangeForm({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  savingPassword,
  passwordMsg,
  onSubmit,
}: PasswordChangeFormProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-500" />
          Change Password
        </CardTitle>
        <CardDescription>Keep your account secure by modifying your password regularly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-sm ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200"
                  : "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200"
              }`}
            >
              {passwordMsg.text}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--muted)]">Current Password</label>
            <PasswordInput
              required
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">New Password</label>
              <PasswordInput
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">Confirm New Password</label>
              <PasswordInput
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPassword} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingPassword ? "Updating Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
