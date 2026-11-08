import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../config/stripe.js', async () => {
  const { stripeMock } = await import('./stripeMock.js');
  return { getStripe: () => stripeMock };
});

import { createApp } from '../app.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { stripeMock, VALID_SIGNATURE } from './stripeMock.js';
import { bearer, clearDb, makeProduct, registerUser, startDb, stopDb } from './helpers.js';

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  vi.clearAllMocks();
});

/** Adds to cart + creates a checkout session; returns the order and its PaymentIntent id. */
async function placeOrder(token, product, qty = 1) {
  await request(app).put('/api/cart/items').set(bearer(token)).send({ productId: String(product._id), qty });
  const res = await request(app).post('/api/checkout/session').set(bearer(token));
  expect(res.status).toBe(200);
  const order = await Order.findById(res.body.orderId);
  return { orderId: order._id, paymentIntentId: order.paymentIntentId };
}

let eventCounter = 0;
const sendEvent = (type, paymentIntentId, signature = VALID_SIGNATURE) => {
  eventCounter += 1;
  const event = { id: `evt_${eventCounter}`, type, data: { object: { id: paymentIntentId } } };
  const req = request(app).post('/api/checkout/webhook').set('Content-Type', 'application/json');
  if (signature) req.set('stripe-signature', signature);
  return req.send(JSON.stringify(event));
};

describe('POST /checkout/webhook', () => {
  it('rejects an invalid signature with 400 and changes nothing', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId, orderId } = await placeOrder(token, p, 2);

    const res = await sendEvent('payment_intent.succeeded', paymentIntentId, 'forged');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    expect((await sendEvent('payment_intent.succeeded', paymentIntentId, null)).status).toBe(400);

    expect((await Product.findById(p._id)).stock).toBe(5);
    expect((await Order.findById(orderId)).status).toBe('pending');
  });

  it('on payment_intent.succeeded: decrements stock, marks the order paid and clears the cart', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId, orderId } = await placeOrder(token, p, 2);

    const res = await sendEvent('payment_intent.succeeded', paymentIntentId);
    expect(res.status).toBe(200);
    expect((await Product.findById(p._id)).stock).toBe(3);
    expect((await Order.findById(orderId)).status).toBe('paid');
    expect((await request(app).get('/api/cart').set(bearer(token))).body.items).toEqual([]);
  });

  it('is idempotent: the same event delivered twice decrements stock once', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId, orderId } = await placeOrder(token, p, 2);

    expect((await sendEvent('payment_intent.succeeded', paymentIntentId)).status).toBe(200);
    expect((await sendEvent('payment_intent.succeeded', paymentIntentId)).status).toBe(200);

    expect((await Product.findById(p._id)).stock).toBe(3);
    expect((await Order.findById(orderId)).status).toBe('paid');
  });

  it('is idempotent under concurrent duplicate deliveries', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId } = await placeOrder(token, p, 2);

    const results = await Promise.all(Array.from({ length: 5 }, () => sendEvent('payment_intent.succeeded', paymentIntentId)));
    results.forEach((r) => expect(r.status).toBe(200));
    expect((await Product.findById(p._id)).stock).toBe(3);
  });

  it('on payment_intent.payment_failed: order failed, stock untouched, cart kept', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId, orderId } = await placeOrder(token, p, 2);

    expect((await sendEvent('payment_intent.payment_failed', paymentIntentId)).status).toBe(200);
    expect((await Order.findById(orderId)).status).toBe('failed');
    expect((await Product.findById(p._id)).stock).toBe(5);
    expect((await request(app).get('/api/cart').set(bearer(token))).body.items).toHaveLength(1);
  });

  it('ignores unrelated events and unknown PaymentIntents with 200', async () => {
    expect((await sendEvent('charge.refunded', 'pi_x')).status).toBe(200);
    expect((await sendEvent('payment_intent.succeeded', 'pi_does_not_exist')).status).toBe(200);
  });

  it('concurrent last-unit purchase: exactly one order is paid, the other fails and is refunded, stock never negative', async () => {
    const alice = await registerUser(app);
    const bob = await registerUser(app);
    const last = await makeProduct({ name: 'Last One', stock: 1 });

    const a = await placeOrder(alice.token, last, 1);
    const b = await placeOrder(bob.token, last, 1); // both checkouts pass: stock is still 1

    const [ra, rb] = await Promise.all([
      sendEvent('payment_intent.succeeded', a.paymentIntentId),
      sendEvent('payment_intent.succeeded', b.paymentIntentId),
    ]);
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);

    expect((await Product.findById(last._id)).stock).toBe(0);
    const statuses = [(await Order.findById(a.orderId)).status, (await Order.findById(b.orderId)).status].sort();
    expect(statuses).toEqual(['failed', 'paid']);
    expect(stripeMock.refunds.create).toHaveBeenCalledTimes(1);

    const failed = await Order.findOne({ status: 'failed' });
    expect(failed.failureReason).toBe('OUT_OF_STOCK');
    expect(failed.refundId).toBe('re_test_1');
  });

  it('payment_failed then succeeded on the same intent (retry with another card) → order paid, stock -1', async () => {
    const { token } = await registerUser(app);
    const p = await makeProduct({ stock: 5 });
    const { paymentIntentId, orderId } = await placeOrder(token, p, 2);

    await sendEvent('payment_intent.payment_failed', paymentIntentId);
    expect((await Order.findById(orderId)).status).toBe('failed');
    expect((await sendEvent('payment_intent.succeeded', paymentIntentId)).status).toBe(200);

    expect((await Order.findById(orderId)).status).toBe('paid');
    expect((await Product.findById(p._id)).stock).toBe(3);
  });

  it('rolls back earlier decrements when a later line cannot be fulfilled', async () => {
    const { token } = await registerUser(app);
    const plenty = await makeProduct({ name: 'Plenty', stock: 10 });
    const scarce = await makeProduct({ name: 'Scarce', stock: 2 });
    await request(app).put('/api/cart/items').set(bearer(token)).send({ productId: String(plenty._id), qty: 3 });
    const { paymentIntentId, orderId } = await placeOrder(token, scarce, 2);
    // The order above now holds both lines; drain the scarce product after checkout validated it.
    await Product.updateOne({ _id: scarce._id }, { stock: 0 });

    expect((await sendEvent('payment_intent.succeeded', paymentIntentId)).status).toBe(200);
    expect((await Order.findById(orderId)).status).toBe('failed');
    expect((await Product.findById(plenty._id)).stock).toBe(10); // restored
    expect((await Product.findById(scarce._id)).stock).toBe(0);
    expect(stripeMock.refunds.create).toHaveBeenCalledTimes(1);
  });
});
