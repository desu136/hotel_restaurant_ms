import { signToken, TokenPayload } from '../../src/lib/auth';
import { BRANCH_A_ID, TENANT_A_ID, USER_ID } from './ids';

export async function authToken(roles: string[], overrides: Partial<TokenPayload> = {}): Promise<string> {
  return signToken({
    userId: USER_ID,
    tenantId: TENANT_A_ID,
    branchId: BRANCH_A_ID,
    roles,
    ...overrides,
  });
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
