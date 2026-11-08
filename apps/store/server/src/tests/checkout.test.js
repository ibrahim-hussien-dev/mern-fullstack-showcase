import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../config/stripe.js', async () => {
  const { stripeMock } = await import('./stripeMock.js');
  return { getStripe: () => stripeMock };
});

import { createApp } from '../app.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { stripeMock } from './stripeMock.js';
import { bearer, clearDb, makeProduct, registerUser, startDb, stopDb } from './helpers.js';

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  vi.clearAllMocks();
});

const addToCart = (token, productId, qty) =>
  request(app).put('/api/cart/items').set(bearer(token)).send({ productId: String(productId), qty });
const checkout = (token) => request(app).post('/api/checkout/session').set(bearer(token));

describe('POST /checkout/session', () => {
  it('requires authentication', async () => {
    expect((await request(app).post('/api/checkout/session')).status).toBe(401);
  });

  it('rejects an empty cart', async () => {
    const { token } = await registerUser(app);
    const res = await checkout(token);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_CART');
  });

  it('returns 409 with details when stock became insufficient, and creates nothing', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ name: 'Scarce', stock: 5 });
    await addToCart(token, p._id, 3);
    await Product.updateOne({ _id: p._id }, { stock: 2 }); // someone else bought some

    const res = await checkout(token);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.details).toEqual([
      { productId: String(p._id), name: 'Scarce', requested: 3, available: 2 },
    ]);
    expect(await Order.countDocuments()).toBe(0);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('re-prices from the database, snapshots the order and creates a PaymentIntent', async () => {
    const { token, user } = await registerUser(app);
    const p = await makeProduct({ name: 'Gizmo', priceCents: 1000, stock: 5 });
    await addToCart(token, p._id, 2);
    await Product.updateOne({ _id: p._id }, { priceCents: 1500 }); // price changed after adding to cart

    const res = await checkout(token).send({ amount: 1, totalCents: 1 }); // client-sent prices are ignored
    expect(res.status).toBe(200);
    expect(res.body.clientSecret).toEqual(expect.any(String));

    expect(stripeMock.paymentIntents.create).toHaveBeenCalledTimes(1);
    const [params] = stripeMock.paymentIntents.create.mock.calls[0];
    expect(params).toMatchObject({
      amount: 3000,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: res.body.orderId, userId: user._id },
    });

    const order = await Order.findById(res.body.orderId);
    expect(order.status).toBe('pending');
    expect(order.totalCents).toBe(3000);
    expect(order.items[0]).toMatchObject({ name: 'Gizmo', priceCents: 1500, qty: 2 });
    expect(order.paymentIntentId).toMatch(/^pi_test_/);
    expect((await Product.findById(p._id)).stock).toBe(5); // stock untouched until the webhook
  });

  it('marks the order failed and returns 502 if Stripe errors', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct();
    await addToCart(token, p._id, 1);
    stripeMock.paymentIntents.create.mockRejectedValueOnce(new Error('stripe down'));
    const res = await checkout(token);
    expect(res.status).toBe(502);
    expect((await Order.findOne()).status).toBe('failed');
  });
});

describe('orders', () => {
  it('only exposes the owner\'s orders', async () => {
    const alice = await registerUser(app);
    const bob = await registerUser(app);
    const p = await makeProduct();
    await addToCart(alice.token, p._id, 1);
    const { body } = await checkout(alice.token);

    const mine = await request(app).get('/api/orders').set(bearer(alice.token));
    expect(mine.body).toHaveLength(1);
    expect((await request(app).get(`/api/orders/${body.orderId}`).set(bearer(alice.token))).status).toBe(200);

    expect((await request(app).get('/api/orders').set(bearer(bob.token))).body).toEqual([]);
    expect((await request(app).get(`/api/orders/${body.orderId}`).set(bearer(bob.token))).status).toBe(404);
    expect((await request(app).get('/api/orders/not-an-id').set(bearer(bob.token))).status).toBe(404);
    expect((await request(app).get('/api/orders')).status).toBe(401);
  });
});
