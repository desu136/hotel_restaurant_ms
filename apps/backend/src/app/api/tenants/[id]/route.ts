import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload || !payload.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await params.id;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: { include: { plan: true } },
        modules: true,
        users: { where: { status: 'ACTIVE' }, take: 1 }
      }
    });

    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload || !payload.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = await params.id;
    const body = await req.json();
    
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: body.status }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
