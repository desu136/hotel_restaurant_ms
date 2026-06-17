import { SignJWT, jwtVerify } from 'jose';

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  userId: string;
  tenantId?: string | null;
  branchId?: string | null;
  roles: string[];
}

export const signToken = async (payload: TokenPayload): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Set standard expiration
    .sign(getJwtSecretKey());
};

export const verifyToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const getTokenFromRequest = (req: any): string | null => {
  if (typeof req.headers?.get === 'function') {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(cookieHeader.split('; ').map((c: string) => {
        const [key, ...v] = c.split('=');
        return [key, v.join('=')];
      }));
      if (cookies.token) {
        return cookies.token;
      }
    }
  }
  return null;
};
