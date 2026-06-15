export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { listPlans, createPlan } from "@/modules/admin/subscriptions/subscriptions.service";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const plans = await listPlans();
  return NextResponse.json({ success: true, data: plans });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const plan = await createPlan(body);
    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/admin/subscriptions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
