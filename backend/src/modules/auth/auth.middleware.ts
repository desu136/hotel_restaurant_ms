import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/modules/auth/auth.service";

export type AuthResult =
  | { ok: true; payload: Awaited<ReturnType<typeof verifyToken>> }
  | { ok: false; response: NextResponse };

/**
 * Verifies the request is authenticated and the user has the required role.
 * Usage:
 *   const auth = await requireRole(req, "SUPER_ADMIN");
 *   if (!auth.ok) return auth.response;
 */
export async function requireRole(req: Request, role: string): Promise<AuthResult> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.roles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, payload };
}

/**
 * Verifies the request is authenticated (any role).
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, payload };
}
