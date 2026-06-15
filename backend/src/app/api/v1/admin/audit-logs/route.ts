export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { listAuditLogs } from "@/modules/admin/audit-logs/audit.service";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const result = await listAuditLogs({
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "20"),
  });

  return NextResponse.json(result);
}
