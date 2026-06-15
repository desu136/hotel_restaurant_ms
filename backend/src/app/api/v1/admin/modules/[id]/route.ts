export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { updateModule } from "@/modules/admin/modules/modules.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const module = await updateModule(id, body);
    return NextResponse.json({ success: true, module });
  } catch (error) {
    console.error("PATCH /api/v1/admin/modules/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
