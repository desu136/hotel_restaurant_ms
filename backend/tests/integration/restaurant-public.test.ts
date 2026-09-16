import request from 'supertest';
import app from '../../src/index';
import { MENU_ITEM_ID, MISSING_ID, RESTAURANT_ID, TABLE_ID } from '../helpers/ids';

describe('Public restaurant suite', () => {
  test('GET /api/restaurant/public/details/:id returns restaurant branding', async () => {
    const res = await request(app).get(`/api/restaurant/public/details/${RESTAURANT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(RESTAURANT_ID);
    expect(res.body.name).toBe('Tenant A Restaurant');
  });

  test('GET /api/restaurant/public/details/:id returns 404 when missing', async () => {
    const res = await request(app).get(`/api/restaurant/public/details/${MISSING_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('GET /api/restaurant/public/categories/:id returns categories', async () => {
    const res = await request(app).get(`/api/restaurant/public/categories/${RESTAURANT_ID}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Pasta');
  });

  test('GET /api/restaurant/public/menu/:id returns available items', async () => {
    const res = await request(app).get(`/api/restaurant/public/menu/${RESTAURANT_ID}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(MENU_ITEM_ID);
    expect(res.body[0].display_name).toBe('Truffle Pasta');
  });

  test('GET /api/restaurant/public/table/:id returns table for QR dine-in', async () => {
    const res = await request(app).get(`/api/restaurant/public/table/${TABLE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.table_number).toBe('1');
  });

  test('GET /api/restaurant/public/table/:id returns 404 for unknown table', async () => {
    const res = await request(app).get(`/api/restaurant/public/table/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/restaurant/public/list returns restaurants without auth', async () => {
    const res = await request(app).get('/api/restaurant/public/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(RESTAURANT_ID);
  });

  test('GET /api/restaurant/public/config returns a restaurant catalog', async () => {
    const res = await request(app).get('/api/restaurant/public/config');
    expect(res.status).toBe(200);
    expect(res.body.restaurants || res.body.modules).toBeTruthy();
  });

  test('authenticated restaurant list requires a token', async () => {
    const res = await request(app).get('/api/restaurant/list');
    expect(res.status).toBe(401);
  });
});
