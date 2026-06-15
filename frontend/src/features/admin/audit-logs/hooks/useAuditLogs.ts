import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AuditLog } from "@/features/admin/types";

interface AuditLogsResponse {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useAuditLogs(page = 1, limit = 15) {
  return useQuery<AuditLogsResponse>({
    queryKey: ["admin-audit-logs", page, limit],
    queryFn: () => apiFetch(`/api/v1/admin/audit-logs?page=${page}&limit=${limit}`),
  });
}
