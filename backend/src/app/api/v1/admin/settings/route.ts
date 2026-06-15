export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { listSettings, updateSettings } from "@/modules/admin/settings/settings.service";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  const settings = await listSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    if (!Array.isArray(body.settings)) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
    }
    const settings = await updateSettings(body.settings);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PATCH /api/v1/admin/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
