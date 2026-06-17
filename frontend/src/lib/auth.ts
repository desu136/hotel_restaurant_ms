/**
 * Frontend auth utilities — token verification only.
 * Token signing lives exclusively in backend/src/lib/auth.ts.
 */
import { jwtVerify } from "jose";
import { decodeJwt } from "jose";

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not defined");
  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  userId: string;
  tenantId?: string | null;
  branchId?: string | null;
  roles: string[];
}

export const verifyToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    const payload = decodeJwt(token);
    
    // Check expiration: exp is in seconds, Date.now() is in milliseconds
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
};
