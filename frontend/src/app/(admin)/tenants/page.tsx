"use client";

import { useState } from "react";
import {
  Building2, Search, CheckCircle2, XCircle, Clock,
  X, Plus, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import Link from "next/link";
import {
  useTenants, useCreateTenant, useApproveTenant, useUpdateTenantStatus,
} from "@/features/admin/tenants/hooks/useTenants";
import type { CreateTenantInput } from "@/features/admin/types";

const EMPTY_FORM: CreateTenantInput = {
  business_name: "", owner_name: "", email: "", phone: "",
  business_type: "HOTEL", address: "", license_info: "", tax_info: "",
};

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  PENDING:   { label: "Pending",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",        dot: "bg-amber-500"  },
  SUSPENDED: { label: "Suspended", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",    dot: "bg-orange-500" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",               dot: "bg-red-500"    },
};

const TYPE_LABELS: Record<string, string> = {
  HOTEL: "Hotel", RESTAURANT: "Restaurant", HOTEL_RESTAURANT: "Hotel & Restaurant",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantInput>(EMPTY_FORM);
  const [createError, setCreateError] = useState("");

  const { data, isLoading } = useTenants({ page, search, status });
  const createTenant = useCreateTenant();
  const approveTenant = useApproveTenant();
  const updateStatus = useUpdateTenantStatus();

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this tenant?")) return;
    try { await approveTenant.mutateAsync({ id }); }
    catch (err: any) { alert(err.message || "Failed to approve tenant."); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Mark this tenant as ${newStatus}?`)) return;
    try { await updateStatus.mutateAsync({ id, status: newStatus }); }
    catch (err: any) { alert(err.message || `Failed.`); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      await createTenant.mutateAsync(createForm);
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create tenant.");
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Tenants</h1>
        <p className="text-[var(--muted)]">Manage registered businesses and their platform access.</p>
      </div>

      {/* Toolbar row 1 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--color-primary-600)]" />
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--muted)] font-mono">
            {meta?.total ?? tenants.length} tenants
          </span>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(""); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* Toolbar row 2: search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, owner, or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="sm:w-40 px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {(search || status) && (
          <button
            onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
            className="px-3 py-2 border border-[var(--surface-border)] rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Excel-style table */}
      <div className="rounded-lg overflow-hidden border border-[var(--surface-border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-hover)" }}>
                {["#", "Business", "Owner", "Contact", "Type", "Status", "Registered", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`border border-[var(--surface-border)] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap select-none
                      ${i === 0 ? "w-10 text-center" : ""}
                      ${h === "Actions" ? "text-center sticky right-0 z-10" : ""}
                      ${h === "Status" ? "text-center" : ""}
                    `}
                    style={h === "Actions" ? { background: "var(--surface-hover)" } : {}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="border border-[var(--surface-border)] px-6 py-16 text-center">
                    <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-[var(--muted)] mt-3">Loading tenants…</p>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-[var(--surface-border)] px-6 py-16 text-center">
                    <Building2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-3 opacity-30" />
                    <p className="text-sm font-medium text-[var(--muted)]">No tenants found. Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : tenants.map((tenant, idx) => {
                const sm = STATUS_META[tenant.status] ?? STATUS_META.PENDING;
                const rowBg = idx % 2 === 0 ? "var(--surface)" : "color-mix(in srgb, var(--surface-hover) 40%, transparent)";
                const hoverBg = "color-mix(in srgb, var(--color-primary-500) 6%, var(--surface))";
                return (
                  <tr
                    key={tenant.id}
                    className="transition-colors"
                    style={{ background: rowBg }}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                  >
                    {/* Row # */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-center text-xs text-[var(--muted)] font-mono select-none w-10">
                      {(page - 1) * 10 + idx + 1}
                    </td>

                    {/* Business */}
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

                    {/* Owner */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--foreground)]">{tenant.owner_name}</div>
                    </td>

                    {/* Contact */}
                    <td className="border border-[var(--surface-border)] px-3 py-2">
                      <div className="text-xs text-[var(--muted)] font-mono">{tenant.email}</div>
                      {tenant.phone && <div className="text-xs text-[var(--muted)] font-mono">{tenant.phone}</div>}
                    </td>

                    {/* Type */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-primary-600)]/10 text-[var(--color-primary-600)] font-semibold">
                        {TYPE_LABELS[tenant.business_type] ?? tenant.business_type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold ${sm.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
                        {sm.label}
                      </span>
                    </td>

                    {/* Registered */}
                    <td className="border border-[var(--surface-border)] px-3 py-2 text-[var(--muted)] whitespace-nowrap text-xs font-mono">
                      {fmt(tenant.created_at)}
                    </td>

                    {/* Actions */}
                    <td
                      className="border border-[var(--surface-border)] px-3 py-2 text-center sticky right-0 z-10"
                      style={{ background: "inherit" }}
                    >
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {tenant.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(tenant.id)}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(tenant.id, "REJECTED")}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {tenant.status === "ACTIVE" && (
                          <button
                            onClick={() => handleUpdateStatus(tenant.id, "SUSPENDED")}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {tenant.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleUpdateStatus(tenant.id, "ACTIVE")}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-primary-600)]/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer — pagination */}
        {meta && (
          <div
            className="px-4 py-2.5 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--muted)]"
            style={{ background: "var(--surface-hover)" }}
          >
            <span>
              Showing <strong>{(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)}</strong> of <strong>{meta.total}</strong> tenants
            </span>
            {meta.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-[var(--surface-border)] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono">{page} / {meta.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-1 rounded hover:bg-[var(--surface-border)] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Add New Tenant</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Admin-initiated tenant registration</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">{createError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Business Name *", key: "business_name", type: "text", ph: "e.g. Sunrise Hotel" },
                  { label: "Owner Name *", key: "owner_name", type: "text", ph: "Full name" },
                  { label: "Email *", key: "email", type: "email", ph: "owner@business.com" },
                  { label: "Phone *", key: "phone", type: "tel", ph: "+251..." },
                ].map(({ label, key, type, ph }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</label>
                    <input required type={type} value={(createForm as any)[key]}
                      onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                      placeholder={ph}
                      className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                ))}
              </div>

              {/* Business Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Business Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "HOTEL", label: "Hotel", icon: "🏨" },
                    { value: "RESTAURANT", label: "Restaurant", icon: "🍽️" },
                    { value: "HOTEL_RESTAURANT", label: "Hotel & Restaurant", icon: "🏨🍽️" },
                  ].map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => setCreateForm({ ...createForm, business_type: opt.value })}
                      className={`py-2.5 px-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        createForm.business_type === opt.value
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
                <input type="text" value={createForm.address ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Street, City, Country"
                  className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">License No.</label>
                  <input type="text" value={createForm.license_info ?? ""}
                    onChange={(e) => setCreateForm({ ...createForm, license_info: e.target.value })}
                    placeholder="License number"
                    className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Tax ID</label>
                  <input type="text" value={createForm.tax_info ?? ""}
                    onChange={(e) => setCreateForm({ ...createForm, tax_info: e.target.value })}
                    placeholder="Tax ID / TIN"
                    className="w-full px-3 py-2 bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--surface-border)]">
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors">Cancel</button>
                <button type="submit" disabled={createTenant.isPending}
                  className="px-5 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                  {createTenant.isPending ? "Creating…" : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
