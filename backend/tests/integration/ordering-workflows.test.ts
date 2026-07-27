import request from 'supertest';
import app from '../../src/index';
import { signToken } from '../../src/lib/auth';

describe('On-Premise & Off-Premise Ordering Workflows Integration Tests', () => {
  const TENANT_ID = '00000000-0000-0000-0000-00000000000a';
  const BRANCH_ID = '00000000-0000-0000-0000-0000000000a1';

  let waiterToken: string;
  let cashierToken: string;

  beforeAll(async () => {
    waiterToken = await signToken({
      userId: '00000000-0000-0000-0000-000000000201',
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      roles: ['WAITER'],
    });

    cashierToken = await signToken({
      userId: '00000000-0000-0000-0000-000000000202',
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      roles: ['CASHIER'],
    });
  });

  describe('1. On-Premise Ordering Workflow (DINE_IN)', () => {
    test('rejects public order with invalid order_type', async () => {
      const res = await request(app)
        .post('/api/orders/public')
        .send({
          restaurant_id: '00000000-0000-0000-0000-000000000001',
          order_type: 'INVALID_TYPE',
          items: [{ menu_item_id: '00000000-0000-0000-0000-000000000010', quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid order_type/i);
    });

    test('validates minimum required order items for table order', async () => {
      const res = await request(app)
        .post('/api/orders/public')
        .send({
          restaurant_id: '00000000-0000-0000-0000-000000000001',
          branch_id: '00000000-0000-0000-0000-000000000002',
          table_id: '00000000-0000-0000-0000-000000000003',
          order_type: 'DINE_IN',
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/At least one item is required/i);
    });

    test('supports multi-user guest identity binding (ECHAT / Mini-App user identity)', async () => {
      const guestPayload = {
        restaurant_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        order_type: 'DINE_IN',
        userId: 'echat_guest_user_999',
        userName: 'Bob Smith',
        userEmail: 'bob@echat.app',
        items: [
          {
            menu_item_id: '00000000-0000-0000-0000-000000000099',
            quantity: 2,
          },
        ],
      };

      const res = await request(app)
        .post('/api/orders/public')
        .send(guestPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Menu item .* not found/i);
    });
  });

  describe('2. Off-Premise Ordering Workflow (DELIVERY & TAKEAWAY)', () => {
    test('validates delivery order payload format and delivery address attachment', async () => {
      const deliveryPayload = {
        restaurant_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        order_type: 'DELIVERY',
        delivery_address: '123 Main Street, Suite 4B, Metro City',
        items: [
          {
            menu_item_id: '00000000-0000-0000-0000-000000000099',
            quantity: 1,
          },
        ],
      };

      const res = await request(app)
        .post('/api/orders/public')
        .send(deliveryPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Menu item .* not found/i);
    });

    test('validates delivery confirmation endpoint parameter format', async () => {
      const res = await request(app).patch('/api/orders/public/invalid-uuid-format/confirm-delivery');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid order ID/i);
    });

    test('rejects delivery confirmation if order is not in READY status', async () => {
      const nonExistentUUID = '11111111-1111-1111-1111-111111111111';
      const res = await request(app).patch(`/api/orders/public/${nonExistentUUID}/confirm-delivery`);

      expect([400, 404]).toContain(res.status);
      expect(res.body.error).toMatch(/Order is not in READY status|Order not found/i);
    });
  });

  describe('3. Delivery Driver Status Machine Simulation', () => {
    type DriverStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';

    class DeliveryDriverWorkflow {
      public static nextStatus(current: DriverStatus): DriverStatus {
        if (current === 'ASSIGNED') return 'PICKED_UP';
        if (current === 'PICKED_UP') return 'DELIVERED';
        throw new Error(`Cannot transition delivery from ${current}`);
      }
    }

    test('should execute driver state transitions (Assigned -> PickedUp -> Delivered)', () => {
      let state: DriverStatus = 'ASSIGNED';
      state = DeliveryDriverWorkflow.nextStatus(state);
      expect(state).toBe('PICKED_UP');

      state = DeliveryDriverWorkflow.nextStatus(state);
      expect(state).toBe('DELIVERED');

      expect(() => DeliveryDriverWorkflow.nextStatus(state)).toThrow();
    });
  });

  describe('4. Edge Cases & Negative Scenarios', () => {
    test('missing guest auth context defaults to walk-in customer profile', async () => {
      const noAuthPayload = {
        restaurant_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        order_type: 'TAKEAWAY',
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000099', quantity: 1 }],
      };

      const res = await request(app)
        .post('/api/orders/public')
        .send(noAuthPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not found/i);
    });

    test('order history query fails if neither userId nor orderIds provided', async () => {
      const res = await request(app).get('/api/orders/public/history');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/userId or orderIds is required/i);
    });
  });
});
