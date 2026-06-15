export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { registerTenant } from "@/modules/public/tenants/tenants.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, businessType, ownerName, email, phone, password } = body;

    if (!businessName || !businessType || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tenant = await registerTenant({ businessName, businessType, ownerName, email, phone, password });
    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/public/tenants/register error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
