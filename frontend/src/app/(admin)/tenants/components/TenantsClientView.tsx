"use client";

import React, { useState } from "react";
import { Building2, Search, Plus } from "lucide-react";
import {
  useTenants, useCreateTenant, useApproveTenant, useUpdateTenantStatus, useDeleteTenant,
} from "@/features/admin/tenants/hooks/useTenants";
import type { CreateTenantInput } from "@/features/admin/types";
import { EMPTY_FORM, STATUS_META, TYPE_LABELS, fmt } from "./types";
import TenantTable from "./TenantTable";
import CreateTenantModal, { CreatedCredentialsModal } from "./CreateTenantModal";

export default function TenantsClientView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantInput>(EMPTY_FORM);
  const [createError, setCreateError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; temporary_password: string } | null>(null);

  const { data, isLoading } = useTenants({ page, search, status });
  const createTenant = useCreateTenant();
  const approveTenant = useApproveTenant();
  const updateStatus = useUpdateTenantStatus();
  const deleteTenant = useDeleteTenant();

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
    catch (err: any) { alert(err.message || "Failed."); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
    try { await deleteTenant.mutateAsync(id); }
    catch (err: any) { alert(err.message || "Failed to delete tenant."); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      const result = await createTenant.mutateAsync(createForm);
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      if (result?.owner_credentials) setCreatedCredentials(result.owner_credentials);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create tenant.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Tenants</h1>
        <p className="text-[var(--muted)]">Manage registered businesses and their platform access.</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--color-primary-600)]" />
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--muted)] font-mono">
            {meta?.total ?? tenants.length} tenants
          </span>
        </div>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(""); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input type="text" placeholder="Search by name, owner, or email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="sm:w-40 px-3 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {(search || status) && (
          <button onClick={() => { setSearch(""); setStatus(""); setPage(1); }}
            className="px-3 py-2 border border-[var(--surface-border)] rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors">
            Clear
          </button>
        )}
      </div>

      <TenantTable
        tenants={tenants} isLoading={isLoading} page={page} meta={meta}
        statusMeta={STATUS_META} typeLabels={TYPE_LABELS} fmtDate={fmt}
        onApprove={handleApprove} onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete} isDeletePending={deleteTenant.isPending}
        onPageChange={setPage}
      />

      {isCreateOpen && (
        <CreateTenantModal
          form={createForm} onChange={setCreateForm}
          onSubmit={handleCreate} onClose={() => setIsCreateOpen(false)}
          isPending={createTenant.isPending} error={createError}
        />
      )}

      {createdCredentials && (
        <CreatedCredentialsModal credentials={createdCredentials} onClose={() => setCreatedCredentials(null)} />
      )}
    </div>
  );
}
