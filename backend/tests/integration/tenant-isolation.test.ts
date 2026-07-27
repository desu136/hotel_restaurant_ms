import request from 'supertest';
import app from '../../src/index';
import { signToken } from '../../src/lib/auth';

describe('Mini-App SDK & Multi-Tenant Isolation Integration Tests', () => {
  const TENANT_A_ID = '00000000-0000-0000-0000-00000000000a';
  const BRANCH_A_ID = '00000000-0000-0000-0000-0000000000a1';
  const TENANT_B_ID = '00000000-0000-0000-0000-00000000000b';
  const BRANCH_B_ID = '00000000-0000-0000-0000-0000000000b1';

  let tenantAToken: string;
  let tenantAOwnerToken: string;

  beforeAll(async () => {
    tenantAToken = await signToken({
      userId: '00000000-0000-0000-0000-000000000101',
      tenantId: TENANT_A_ID,
      branchId: BRANCH_A_ID,
      roles: ['RESTAURANT_MANAGER'],
    });

    tenantAOwnerToken = await signToken({
      userId: '00000000-0000-0000-0000-000000000102',
      tenantId: TENANT_A_ID,
      branchId: BRANCH_A_ID,
      roles: ['HOTEL_OWNER'],
    });
  });

  describe('JWT Auth & Tenant Context Extraction', () => {
    test('should reject requests without authorization header or cookie', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized: Missing token/i);
    });

    test('should reject requests with malformed or invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer invalid.jwt.token.string');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized: Invalid or expired token/i);
    });

    test('should accept valid JWT token and inject tenant context into request', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Cross-Tenant Data Access Prevention (Negative Tests)', () => {
    test('Tenant A manager cannot fetch order details belonging to Tenant B branch', async () => {
      const tenantBOrderId = '00000000-0000-0000-0000-000000000099';

      const res = await request(app)
        .get(`/api/orders/${tenantBOrderId}`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect([403, 404]).toContain(res.status);
    });

    test('Tenant A staff cannot modify status of Tenant B order', async () => {
      const tenantBOrderId = '00000000-0000-0000-0000-000000000099';

      const res = await request(app)
        .patch(`/api/orders/${tenantBOrderId}/status`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ status: 'COMPLETED' });

      expect([403, 404]).toContain(res.status);
    });

    test('Tenant A cashier cannot view unpaid billing history of Tenant B', async () => {
      const cashierAToken = await signToken({
        userId: '00000000-0000-0000-0000-000000000103',
        tenantId: TENANT_A_ID,
        branchId: BRANCH_A_ID,
        roles: ['CASHIER'],
      });

      const res = await request(app)
        .get('/api/billing/unpaid')
        .set('Authorization', `Bearer ${cashierAToken}`);

      expect(res.status).toBe(200);
      if (Array.isArray(res.body)) {
        const hasTenantBData = res.body.some((item: any) => item.tenant_id === TENANT_B_ID);
        expect(hasTenantBData).toBe(false);
      }
    });

    test('Tenant A cannot update Tenant B branch settings', async () => {
      const res = await request(app)
        .patch(`/api/branches/${BRANCH_B_ID}`)
        .set('Authorization', `Bearer ${tenantAOwnerToken}`)
        .send({ branch_name: 'Hacked Branch Name' });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('QR Scanner Payload Routing Parameters', () => {
    test('Public order endpoint accepts valid tenant_id and branch_id from QR payload', async () => {
      const qrPayload = {
        restaurant_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        table_id: '00000000-0000-0000-0000-000000000003',
        order_type: 'DINE_IN',
        items: [],
      };

      const res = await request(app)
        .post('/api/orders/public')
        .send(qrPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('At least one item is required');
    });

    test('Public order endpoint rejects payload missing restaurant_id', async () => {
      const res = await request(app)
        .post('/api/orders/public')
        .send({
          branch_id: BRANCH_A_ID,
          items: [{ menu_item_id: '00000000-0000-0000-0000-000000000010', quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/restaurant_id is required/i);
    });
  });
});
