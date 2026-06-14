import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
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

    const tenants = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          where: { status: 'TRIAL' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
