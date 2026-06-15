export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { listModules, createModule } from "@/modules/admin/modules/modules.service";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const modules = await listModules();
  return NextResponse.json({ success: true, modules });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
    }
    const module = await createModule(body);
    return NextResponse.json({ success: true, module }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/admin/modules error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
