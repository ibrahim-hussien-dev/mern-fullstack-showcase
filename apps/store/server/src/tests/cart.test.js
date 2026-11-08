import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { bearer, clearDb, makeProduct, registerUser, startDb, stopDb } from './helpers.js';

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const put = (token, productId, qty) => request(app).put('/api/cart/items').set(bearer(token)).send({ productId: String(productId), qty });

describe('cart', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
    expect((await request(app).put('/api/cart/items').send({})).status).toBe(401);
    expect((await request(app).delete('/api/cart')).status).toBe(401);
  });

  it('starts empty', async () => {
    const { token } = await registerUser(app);
    const res = await request(app).get('/api/cart').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], subtotal: 0 });
  });

  it('adds items and computes the subtotal on the server (cents)', async () => {
    const { token } = await registerUser(app);
    const a = await makeProduct({ name: 'A', priceCents: 1250, stock: 10 });
    const b = await makeProduct({ name: 'B', priceCents: 399, stock: 10 });
    await put(token, a._id, 2);
    const res = await put(token, b._id, 3);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items.find((i) => i.product.name === 'A').qty).toBe(2);
    expect(res.body.subtotal).toBe(1250 * 2 + 399 * 3);
  });

  it('persists the cart across sessions (new login)', async () => {
    const { token, credentials } = await registerUser(app);
    const p = await makeProduct();
    await put(token, p._id, 2);

    const login = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
    const res = await request(app).get('/api/cart').set(bearer(login.body.token));
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ qty: 2 });
    expect(res.body.items[0].product._id).toBe(String(p._id));
  });

  it('updates an existing line instead of duplicating it', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct();
    await put(token, p._id, 1);
    const res = await put(token, p._id, 4);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].qty).toBe(4);
  });

  it('clamps qty to min(stock, 10)', async () => {
    const { token } = await registerUser(app);
    const low = await makeProduct({ stock: 3 });
    const high = await makeProduct({ name: 'High', stock: 500 });
    expect((await put(token, low._id, 99)).body.items.find((i) => i.product._id === String(low._id)).qty).toBe(3);
    expect((await put(token, high._id, 99)).body.items.find((i) => i.product._id === String(high._id)).qty).toBe(10);
  });

  it('rejects out-of-stock products, unknown products and invalid input', async () => {
    const { token } = await registerUser(app);
    const empty = await makeProduct({ stock: 0 });
    expect((await put(token, empty._id, 1)).status).toBe(409);
    expect((await put(token, '64b7f0f2a1b2c3d4e5f60718', 1)).status).toBe(404);
    expect((await put(token, 'not-an-id', 1)).status).toBe(400);
    const p = await makeProduct();
    expect((await put(token, p._id, -1)).status).toBe(400);
    expect((await put(token, p._id, 1.5)).status).toBe(400);
  });

  it('removes a line with qty 0 and clears the whole cart with DELETE', async () => {
    const { token } = await registerUser(app);
    const a = await makeProduct({ name: 'A' });
    const b = await makeProduct({ name: 'B' });
    await put(token, a._id, 1);
    await put(token, b._id, 1);
    const removed = await put(token, a._id, 0);
    expect(removed.body.items).toHaveLength(1);

    const del = await request(app).delete('/api/cart').set(bearer(token));
    expect(del.status).toBe(204);
    expect((await request(app).get('/api/cart').set(bearer(token))).body.items).toEqual([]);
  });

  it('keeps carts separate per user', async () => {
    const one = await registerUser(app);
    const two = await registerUser(app);
    const p = await makeProduct();
    await put(one.token, p._id, 2);
    expect((await request(app).get('/api/cart').set(bearer(two.token))).body.items).toEqual([]);
  });
});
