import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, STORE, register, sendWebhook } from './lib.js';

// Needs: seeded DB (a product with stock 1), real STRIPE_SECRET_KEY on the server (PaymentIntent creation),
// and STRIPE_WEBHOOK_SECRET exported in this shell so we can sign the succeeded event ourselves.
const ready = process.env.STRIPE_WEBHOOK_SECRET && process.env.E2E_STRIPE === '1';

test('two users, last unit: exactly one order paid, stock never negative', { skip: !ready && 'set E2E_STRIPE=1 and STRIPE_WEBHOOK_SECRET' }, async () => {
  const list = await call(STORE, 'GET', '/products?limit=100');
  const last = list.json.items.find((p) => p.stock === 1);
  assert.ok(last, 'need a product with stock 1 (npm run seed)');

  const [a, b] = await Promise.all([register('A'), register('B')]);
  for (const u of [a, b]) {
    const r = await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: last._id, qty: 1 } });
    assert.equal(r.status, 200);
  }

  const sessions = await Promise.all([a, b].map((u) => call(STORE, 'POST', '/checkout/session', { token: u.token })));
  sessions.forEach((s) => assert.equal(s.status, 200, s.text));

  // Resolve each order's paymentIntentId (the client secret is "<pi_id>_secret_<x>").
  const piIds = sessions.map((s) => s.json.clientSecret.split('_secret_')[0]);

  // Fire both "payment succeeded" webhooks at the same moment.
  const hooks = await Promise.all(piIds.map((pi) => sendWebhook('payment_intent.succeeded', pi)));
  hooks.forEach((h) => assert.equal(h.status, 200));

  const orders = await Promise.all([a, b].map((u, i) => call(STORE, 'GET', `/orders/${sessions[i].json.orderId}`, { token: u.token })));
  const statuses = orders.map((o) => o.json.status).sort();
  assert.deepEqual(statuses, ['failed', 'paid']);

  const after = await call(STORE, 'GET', `/products/${last._id}`);
  assert.equal(after.json.stock, 0);
});

test('duplicate webhook delivery is idempotent (stock decremented once)', { skip: !ready && 'set E2E_STRIPE=1 and STRIPE_WEBHOOK_SECRET' }, async () => {
  const list = await call(STORE, 'GET', '/products?limit=100');
  const p = list.json.items.find((x) => x.stock >= 3);
  assert.ok(p);
  const u = await register();
  await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: p._id, qty: 1 } });
  const s = await call(STORE, 'POST', '/checkout/session', { token: u.token });
  const pi = s.json.clientSecret.split('_secret_')[0];
  await Promise.all([1, 2, 3].map(() => sendWebhook('payment_intent.succeeded', pi)));
  const after = await call(STORE, 'GET', `/products/${p._id}`);
  assert.equal(after.json.stock, p.stock - 1);
});
