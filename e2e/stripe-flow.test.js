import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, STORE, register, sendWebhook } from './lib.js';

// Webhook-driven flow using locally-signed events (same signature scheme as `stripe listen`).
// The REAL card flow (4242… / 4000 0000 0000 0002) is manual – see README "Stripe sandbox".
const ready = process.env.STRIPE_WEBHOOK_SECRET && process.env.E2E_STRIPE === '1';
const opts = { skip: !ready && 'set E2E_STRIPE=1 and STRIPE_WEBHOOK_SECRET (+ real sk_test key on server)' };

async function checkoutOne(minStock = 3) {
  const list = await call(STORE, 'GET', '/products?limit=100');
  const p = list.json.items.find((x) => x.stock >= minStock);
  const u = await register();
  await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: p._id, qty: 1 } });
  const s = await call(STORE, 'POST', '/checkout/session', { token: u.token });
  assert.equal(s.status, 200, s.text);
  assert.ok(s.json.clientSecret && s.json.orderId);
  return { u, p, s, pi: s.json.clientSecret.split('_secret_')[0] };
}

test('success: order pending → paid, stock −1, cart emptied', opts, async () => {
  const { u, p, s, pi } = await checkoutOne();
  const pending = await call(STORE, 'GET', `/orders/${s.json.orderId}`, { token: u.token });
  assert.equal(pending.json.status, 'pending');
  assert.equal(pending.json.totalCents, p.priceCents);
  assert.equal((await sendWebhook('payment_intent.succeeded', pi)).status, 200);
  const paid = await call(STORE, 'GET', `/orders/${s.json.orderId}`, { token: u.token });
  assert.equal(paid.json.status, 'paid');
  assert.equal((await call(STORE, 'GET', `/products/${p._id}`)).json.stock, p.stock - 1);
  assert.deepEqual((await call(STORE, 'GET', '/cart', { token: u.token })).json.items, []);
});

test('decline: order failed, stock unchanged, cart kept', opts, async () => {
  const { u, p, s, pi } = await checkoutOne();
  assert.equal((await sendWebhook('payment_intent.payment_failed', pi)).status, 200);
  assert.equal((await call(STORE, 'GET', `/orders/${s.json.orderId}`, { token: u.token })).json.status, 'failed');
  assert.equal((await call(STORE, 'GET', `/products/${p._id}`)).json.stock, p.stock);
  assert.equal((await call(STORE, 'GET', '/cart', { token: u.token })).json.items.length, 1);
});

test('DEFECT PROBE: decline then successful retry on the same PaymentIntent is honoured', opts, async () => {
  // Stripe keeps the same PaymentIntent after a decline; the customer can retry with another card.
  const { u, p, s, pi } = await checkoutOne();
  await sendWebhook('payment_intent.payment_failed', pi);
  await sendWebhook('payment_intent.succeeded', pi);
  const order = await call(STORE, 'GET', `/orders/${s.json.orderId}`, { token: u.token });
  assert.equal(order.json.status, 'paid', 'customer was charged but order stayed failed');
  assert.equal((await call(STORE, 'GET', `/products/${p._id}`)).json.stock, p.stock - 1);
});

test('unknown PaymentIntent is ignored with 200', opts, async () => {
  assert.equal((await sendWebhook('payment_intent.succeeded', 'pi_does_not_exist')).status, 200);
});
