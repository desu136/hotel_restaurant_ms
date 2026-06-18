import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ListTenantsResponse, Tenant, CreateTenantInput } from "@/features/admin/types";

const TENANTS_KEY = "admin-tenants";

// ─── Query params ─────────────────────────────────────────────────────────────
interface ListParams {
  page?: number;
  search?: string;
  status?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTenants(params: ListParams = {}) {
  const { page = 1, search = "", status = "" } = params;
  const qs = new URLSearchParams({ page: String(page), limit: "10" });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);

  return useQuery<ListTenantsResponse>({
    queryKey: [TENANTS_KEY, page, search, status],
    queryFn: () => apiFetch(`/api/v1/admin/tenants?${qs}`),
  });
}

export function useTenant(id: string) {
  return useQuery<Tenant>({
    queryKey: [TENANTS_KEY, id],
    queryFn: () => apiFetch(`/api/v1/admin/tenants/${id}`),
    enabled: !!id,
  });
}

export function useSubscriptionPlans() {
  return useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["admin-plans"],
    queryFn: () => apiFetch("/api/v1/admin/subscriptions"),
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) =>
      apiFetch("/api/v1/admin/tenants", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
}

export function useUpdateTenantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/v1/admin/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
}

export function useApproveTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan_id }: { id: string; plan_id?: string }) =>
      apiFetch(`/api/v1/admin/tenants/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ plan_id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/admin/tenants/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TENANTS_KEY] }),
  });
}
