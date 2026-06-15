export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { getTenant, updateTenant } from "@/modules/admin/tenants/tenants.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tenant);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const tenant = await updateTenant(id, body);
    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error("PATCH /api/v1/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
