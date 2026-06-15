export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { listTenants, createTenant } from "@/modules/admin/tenants/tenants.service";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const result = await listTenants({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    business_type: searchParams.get("business_type") ?? undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "10"),
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const tenant = await createTenant(body);
    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/admin/tenants error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
