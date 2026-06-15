import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { SubscriptionPlan, SystemModule } from "@/features/admin/types";

const PLANS_KEY = "admin-plans";
const MODULES_KEY = "admin-modules";

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function useSubscriptions() {
  return useQuery<{ success: boolean; data: SubscriptionPlan[] }>({
    queryKey: [PLANS_KEY],
    queryFn: () => apiFetch("/api/v1/admin/subscriptions"),
    select: (res) => res,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) =>
      apiFetch("/api/v1/admin/subscriptions", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLANS_KEY] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: any) =>
      apiFetch(`/api/v1/admin/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLANS_KEY] }),
  });
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export function useModules() {
  return useQuery<{ success: boolean; modules: SystemModule[] }>({
    queryKey: [MODULES_KEY],
    queryFn: () => apiFetch("/api/v1/admin/modules"),
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) =>
      apiFetch("/api/v1/admin/modules", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MODULES_KEY] }),
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: any) =>
      apiFetch(`/api/v1/admin/modules/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MODULES_KEY] }),
  });
}
