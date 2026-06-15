import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PlatformSetting } from "@/features/admin/types";

const SETTINGS_KEY = "admin-settings";

export function useSettings() {
  return useQuery<{ success: boolean; settings: PlatformSetting[] }>({
    queryKey: [SETTINGS_KEY],
    queryFn: () => apiFetch("/api/v1/admin/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      apiFetch("/api/v1/admin/settings", { method: "PATCH", body: JSON.stringify({ settings }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_KEY] }),
  });
}
