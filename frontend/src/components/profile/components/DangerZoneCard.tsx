"use client";

import * as React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DangerZoneCardProps {
  onOpenDeleteModal: () => void;
}

export function DangerZoneCard({ onOpenDeleteModal }: DangerZoneCardProps) {
  return (
    <Card className="border-red-200/50 bg-red-50/5 dark:bg-red-950/5">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>Actions in this area are destructive and cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Delete Account</h4>
            <p className="text-xs text-[var(--muted)]">
              Permanently remove your account, staff profiles, and access to all data.
            </p>
          </div>
          <Button
            onClick={onOpenDeleteModal}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeleteAccountModalProps {
  show: boolean;
  onClose: () => void;
  confirmDeletePass: string;
  setConfirmDeletePass: (v: string) => void;
  deleteError: string;
  deletingAccount: boolean;
  onDeleteAccount: (e: React.FormEvent) => void;
}

export function DeleteAccountModal({
  show,
  onClose,
  confirmDeletePass,
  setConfirmDeletePass,
  deleteError,
  deletingAccount,
  onDeleteAccount,
}: DeleteAccountModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
        </div>
        <p className="text-sm text-[var(--muted)] mb-4">
          This action is permanent and cannot be undone. To proceed, please confirm your current password below.
        </p>
        <form onSubmit={onDeleteAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <PasswordInput
              required
              value={confirmDeletePass}
              onChange={(e) => setConfirmDeletePass(e.target.value)}
              placeholder="Type password to confirm"
            />
          </div>

          {deleteError && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 p-2.5 rounded-lg">
              {deleteError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={deletingAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {deletingAccount ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
