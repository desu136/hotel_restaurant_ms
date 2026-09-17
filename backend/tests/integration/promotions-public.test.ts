import request from 'supertest';
import app from '../../src/index';
import { TENANT_A_ID } from '../helpers/ids';

describe('Public promotions suite', () => {
  test('GET /api/promotions/public requires a valid tenantId', async () => {
    const missing = await request(app).get('/api/promotions/public');
    expect(missing.status).toBe(400);

    const invalid = await request(app).get('/api/promotions/public').query({ tenantId: 'not-a-uuid' });
    expect(invalid.status).toBe(400);
  });

  test('GET /api/promotions/public returns promotions for a tenant', async () => {
    const res = await request(app).get('/api/promotions/public').query({ tenantId: TENANT_A_ID });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.promotions)).toBe(true);
  });

  test('POST /api/promotions/public/evaluate requires tenant and items', async () => {
    const res = await request(app).post('/api/promotions/public/evaluate').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/promotions/public/evaluate returns zero discount for empty-value cart', async () => {
    const res = await request(app).post('/api/promotions/public/evaluate').send({
      tenantId: TENANT_A_ID,
      items: [{ menu_item_id: '00000000-0000-0000-0000-000000000010', quantity: 1, unit_price: 0 }],
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.discount_amount).toBe(0);
  });
});
