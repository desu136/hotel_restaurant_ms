export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { approveTenant } from "@/modules/admin/tenants/tenants.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await approveTenant(id, body.plan_id, auth.payload!.userId);

    return NextResponse.json({
      success: true,
      message: "Tenant approved successfully",
      tenant: result.tenant,
      credentials: result.credentials,
    });
  } catch (error: any) {
    console.error("POST /api/v1/admin/tenants/[id]/approve error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status });
  }
}
