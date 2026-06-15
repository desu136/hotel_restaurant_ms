"use client";

import { useState } from "react";
import { Building2, Search, CheckCircle2, XCircle, Clock, X, Plus } from "lucide-react";
import Link from "next/link";
import { useTenants, useCreateTenant, useApproveTenant, useUpdateTenantStatus } from "@/features/admin/tenants/hooks/useTenants";
import type { CreateTenantInput } from "@/features/admin/types";

const EMPTY_FORM: CreateTenantInput = {
  business_name: "", owner_name: "", email: "", phone: "",
  business_type: "HOTEL", address: "", license_info: "", tax_info: ""
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantInput>(EMPTY_FORM);
  const [createError, setCreateError] = useState("");

  // React Query — auto-refetches when search/status/page change
  const { data, isLoading } = useTenants({ page, search, status });
  const createTenant = useCreateTenant();
  const approveTenant = useApproveTenant();
  const updateStatus = useUpdateTenantStatus();

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this tenant?")) return;
    try { await approveTenant.mutateAsync({ id }); }
    catch (err: any) { alert(err.message || "Failed to approve tenant."); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this tenant as ${newStatus}?`)) return;
    try { await updateStatus.mutateAsync({ id, status: newStatus }); }
    catch (err: any) { alert(err.message || `Failed to mark as ${newStatus}.`); }
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tenants</h1>
          <p className="text-[var(--muted)]">Manage registered businesses and their platform access.</p>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(""); setIsCreateOpen(true); }}
          className="inline-flex items-center px-4 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Tenant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-hover)] text-[var(--muted)] border-b border-[var(--surface-border)]">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Business Details</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Owner Contact</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Type</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-border)]">
              {isLoading && tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-[var(--foreground)]">No tenants found</h3>
                    <p className="text-sm text-[var(--muted)] mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-[var(--surface-hover)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--foreground)] text-base">{tenant.business_name}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">ID: {tenant.id.split("-")[0]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{tenant.owner_name}</div>
                      <div className="text-[var(--muted)] text-xs mt-0.5">{tenant.email}</div>
                      <div className="text-[var(--muted)] text-xs">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-blue-400">
                        {tenant.business_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.status === "ACTIVE" && (
                        <span className="inline-flex items-center text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                        </span>
                      )}
                      {tenant.status === "PENDING" && (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                        </span>
                      )}
                      {tenant.status === "SUSPENDED" && (
                        <span className="inline-flex items-center text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Suspended
                        </span>
                      )}
                      {tenant.status === "REJECTED" && (
                        <span className="inline-flex items-center text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <X className="w-3.5 h-3.5 mr-1" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {tenant.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(tenant.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 text-xs font-semibold rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(tenant.id, "REJECTED")}
                              className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 text-xs font-semibold rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {tenant.status === "ACTIVE" && (
                          <button
                            onClick={() => handleUpdateStatus(tenant.id, "SUSPENDED")}
                            className="inline-flex items-center px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 text-xs font-semibold rounded-md transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {tenant.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleUpdateStatus(tenant.id, "ACTIVE")}
                            className="inline-flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 text-xs font-semibold rounded-md transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-[var(--surface-hover)] border border-[var(--surface-border)] hover:bg-[var(--surface-border)] text-[var(--foreground)] text-xs font-semibold rounded-md transition-colors shadow-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-[var(--muted)]">Showing page {meta.page} of {meta.totalPages}</span>
          <div className="flex space-x-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 bg-[var(--surface)] border border-[var(--surface-border)] rounded-md text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
              className="px-3 py-1 bg-[var(--surface)] border border-[var(--surface-border)] rounded-md text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Add New Tenant</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Create a tenant account directly (admin-initiated)</p>
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
                  {createTenant.isPending ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
