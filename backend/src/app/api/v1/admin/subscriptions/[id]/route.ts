export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { updatePlan, deletePlan } from "@/modules/admin/subscriptions/subscriptions.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const plan = await updatePlan(id, body);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("PUT /api/v1/admin/subscriptions/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await deletePlan(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/subscriptions/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
