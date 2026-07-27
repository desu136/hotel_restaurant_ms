"use client";

import React from "react";
import { Building2, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import type { STATUS_META, TYPE_LABELS, fmt } from "./types";

type StatusMeta = typeof STATUS_META;
type Tenant = {
  id: string; business_name: string; owner_name: string;
  email: string; phone?: string; business_type: string;
  status: string; created_at: string;
};

interface Props {
  tenants: Tenant[];
  isLoading: boolean;
  page: number;
  meta?: { total: number; totalPages: number };
  statusMeta: StatusMeta;
  typeLabels: Record<string, string>;
  fmtDate: typeof fmt;
  onApprove: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string, name: string) => void;
  isDeletePending: boolean;
  onPageChange: (page: number) => void;
}

export default function TenantTable({
  tenants, isLoading, page, meta, statusMeta, typeLabels, fmtDate,
  onApprove, onUpdateStatus, onDelete, isDeletePending, onPageChange,
}: Props) {
  const cols = ["#", "Business", "Owner", "Contact", "Type", "Status", "Registered", "Actions"];

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: "var(--surface-hover)" }}>
              {cols.map((h, i) => (
                <th key={h}
                  className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap select-none
                    ${i === 0 ? "w-10 text-center" : ""}
                    ${h === "Actions" ? "text-center sticky right-0 z-10" : ""}
                    ${h === "Status" ? "text-center" : ""}`}
                  style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="border border-[var(--surface-border)] px-6 py-16 text-center">
                <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[var(--muted)] mt-3">Loading tenants…</p>
              </td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={8} className="border border-[var(--surface-border)] px-6 py-16 text-center">
                <Building2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                <p className="text-sm font-medium text-[var(--muted)]">No tenants found. Try adjusting your search or filters.</p>
              </td></tr>
            ) : tenants.map((tenant, idx) => {
              const sm = statusMeta[tenant.status] ?? statusMeta.PENDING;
              const rowBg = idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)";
              const hoverBg = "color-mix(in srgb, var(--color-primary-500) 6%, var(--surface))";
              return (
                <tr key={tenant.id} className="transition-colors" style={{ background: rowBg }}
                  onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center text-xs text-[var(--muted)] font-mono select-none w-10">{(page - 1) * 10 + idx + 1}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary-500)] to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {tenant.business_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)] text-sm leading-tight">{tenant.business_name}</div>
                        <div className="text-[10px] text-[var(--muted)] font-mono">{tenant.id.split("-")[0]}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--foreground)]">{tenant.owner_name}</div>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2">
                    <div className="text-xs text-[var(--muted)] font-mono">{tenant.email}</div>
                    {tenant.phone && <div className="text-xs text-[var(--muted)] font-mono">{tenant.phone}</div>}
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] font-semibold">
                      {typeLabels[tenant.business_type] ?? tenant.business_type}
                    </span>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold ${sm.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
                      {sm.label}
                    </span>
                  </td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap text-xs font-mono">{fmtDate(tenant.created_at)}</td>
                  <td className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10" style={{ background: "inherit" }}>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {tenant.status === "PENDING" && (<>
                        <button onClick={() => onApprove(tenant.id)} className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">Approve</button>
                        <button onClick={() => onUpdateStatus(tenant.id, "REJECTED")} className="px-2 py-1 rounded text-[10px] font-semibold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors">Reject</button>
                      </>)}
                      {tenant.status === "ACTIVE" && (
                        <button onClick={() => onUpdateStatus(tenant.id, "SUSPENDED")} className="px-2 py-1 rounded text-[10px] font-semibold bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 transition-colors">Suspend</button>
                      )}
                      {tenant.status === "SUSPENDED" && (
                        <button onClick={() => onUpdateStatus(tenant.id, "ACTIVE")} className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 transition-colors">Reactivate</button>
                      )}
                      <Link href={`/tenants/${tenant.id}`} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 transition-colors" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => onDelete(tenant.id, tenant.business_name)} disabled={isDeletePending}
                        className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50" title="Delete Tenant">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="px-4 py-2.5 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]"
          style={{ background: "var(--surface-hover)" }}>
          <span>Showing <strong>{(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)}</strong> of <strong>{meta.total}</strong> tenants</span>
          {meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1 rounded hover:bg-[var(--surface-border)] disabled:opacity-40 transition-colors">‹</button>
              <span className="px-2 font-mono">{page} / {meta.totalPages}</span>
              <button onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages}
                className="p-1 rounded hover:bg-[var(--surface-border)] disabled:opacity-40 transition-colors">›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
