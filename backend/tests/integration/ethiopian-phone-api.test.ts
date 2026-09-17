import request from 'supertest';
import app from '../../src/index';
import { authToken, bearer } from '../helpers/tokens';
import { BRANCH_A_ID } from '../helpers/ids';

describe('Ethiopian phone validation on writes', () => {
  test('tenant self-register rejects a non-Ethiopian phone', async () => {
    const res = await request(app).post('/api/tenant/register').send({
      businessName: 'Cafe Test',
      businessType: 'RESTAURANT',
      ownerName: 'Owner',
      email: 'owner@test.com',
      phone: '555-0100',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ethiopian number/i);
  });

  test('creating an employee rejects a non-Ethiopian phone', async () => {
    const token = await authToken(['HOTEL_OWNER']);
    const res = await request(app)
      .post('/api/employees')
      .set(bearer(token))
      .send({
        fullName: 'Waiter Two',
        email: 'waiter2@test.com',
        phone: '555-0100',
        password: 'password123',
        branchId: BRANCH_A_ID,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ethiopian number/i);
  });
});
