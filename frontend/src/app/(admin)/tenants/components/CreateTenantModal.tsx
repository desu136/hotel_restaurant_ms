"use client";

import React from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { CreateTenantInput } from "@/features/admin/types";

interface Props {
  form: CreateTenantInput;
  onChange: (form: CreateTenantInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  error: string;
}

export default function CreateTenantModal({ form, onChange, onSubmit, onClose, isPending, error }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Add New Tenant</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Admin-initiated tenant registration</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Business Name *", key: "business_name", type: "text", ph: "e.g. Grand Cafe" },
              { label: "Owner Name *", key: "owner_name", type: "text", ph: "Full name" },
              { label: "Email *", key: "email", type: "email", ph: "owner@business.com" },
              { label: "Phone *", key: "phone", type: "tel", ph: "+251..." },
            ].map(({ label, key, type, ph }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</label>
                <input required type={type} value={(form as any)[key]}
                  onChange={(e) => onChange({ ...form, [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Business Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "RESTAURANT", label: "Restaurant", icon: "🍽️" },
                { value: "COFFEE_SHOP", label: "Coffee Shop", icon: "☕" },
                { value: "FAST_FOOD", label: "Fast Food Center", icon: "🍔" },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => onChange({ ...form, business_type: opt.value })}
                  className={`py-2.5 px-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    form.business_type === opt.value
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/20 text-[var(--color-primary-700)] dark:text-blue-400"
                      : "border-[var(--surface-border)] hover:bg-[var(--surface-hover)] text-[var(--muted)]"
                  }`}>
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Address</label>
            <input type="text" value={form.address ?? ""} onChange={(e) => onChange({ ...form, address: e.target.value })}
              placeholder="Street, City, Country"
              className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "License No.", key: "license_info", ph: "License number" },
              { label: "Tax ID", key: "tax_info", ph: "Tax ID / TIN" },
            ].map(({ label, key, ph }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</label>
                <input type="text" value={(form as any)[key] ?? ""}
                  onChange={(e) => onChange({ ...form, [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--surface-border)]">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors">Cancel</button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
              {isPending ? "Creating…" : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CredentialsModalProps {
  credentials: { email: string; temporary_password: string };
  onClose: () => void;
}

export function CreatedCredentialsModal({ credentials, onClose }: CredentialsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl shadow-2xl z-10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-base">Tenant Created Successfully</h3>
            <p className="text-xs text-[var(--muted)]">Share these credentials with the business owner.</p>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">⚠️ Temporary Login Credentials</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Email:</span>
              <code className="text-sm font-mono font-bold bg-[var(--surface-hover)] px-2 py-0.5 rounded">{credentials.email}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Temporary Password:</span>
              <code className="text-sm font-mono font-bold bg-[var(--surface-hover)] px-2 py-0.5 rounded">{credentials.temporary_password}</code>
            </div>
          </div>
          <p className="text-[10px] text-[var(--muted)] italic">The owner should log in and change their password immediately.</p>
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white text-sm font-semibold rounded-lg transition-colors">
          Done — I&apos;ve noted the credentials
        </button>
      </div>
    </div>
  );
}
