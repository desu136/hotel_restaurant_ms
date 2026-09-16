import request from 'supertest';
import app from '../../src/index';
import { authToken, bearer } from '../helpers/tokens';

describe('Role-based access suite', () => {
  test('waiter cannot list unpaid bills', async () => {
    const token = await authToken(['WAITER']);
    const res = await request(app).get('/api/billing/unpaid').set(bearer(token));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/insufficient role/i);
  });

  test('cashier can list unpaid bills', async () => {
    const token = await authToken(['CASHIER']);
    const res = await request(app).get('/api/billing/unpaid').set(bearer(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('chef cannot create a waiter order', async () => {
    const token = await authToken(['CHEF']);
    const res = await request(app)
      .post('/api/orders')
      .set(bearer(token))
      .send({ items: [{ menu_item_id: '00000000-0000-0000-0000-000000000010', quantity: 1 }] });
    expect(res.status).toBe(403);
  });

  test('waiter can fetch own READY tickets', async () => {
    const token = await authToken(['WAITER']);
    const res = await request(app).get('/api/orders/my-ready').set(bearer(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('kitchen staff can list tenant orders', async () => {
    const token = await authToken(['CHEF']);
    const res = await request(app).get('/api/orders').set(bearer(token));
    expect([200, 404]).toContain(res.status);
  });

  test('non-owner cannot create a restaurant', async () => {
    const token = await authToken(['RESTAURANT_MANAGER']);
    const res = await request(app)
      .post('/api/restaurant/my')
      .set(bearer(token))
      .send({ name: 'Unauthorized Brand' });
    expect(res.status).toBe(403);
  });
});
