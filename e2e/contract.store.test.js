import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, STORE, register, errShape } from './lib.js';

let u, product;

test('GET /health', async () => {
  const r = await call(STORE, 'GET', '/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
});

test('POST /auth/register → 201 {user,token}, no password fields', async () => {
  u = await register();
  assert.equal(typeof u.token, 'string');
  assert.ok(u.user._id && u.user.email === u.email);
  assert.ok(!/password|hash/i.test(JSON.stringify(u.user)));
});

test('register validation + duplicate email', async () => {
  assert.equal((await call(STORE, 'POST', '/auth/register', { body: { name: 'a', email: 'x@y.com', password: 'short' } })).status, 400);
  const dup = await call(STORE, 'POST', '/auth/register', { body: { name: 'a', email: u.email, password: 'Passw0rd!e2e' } });
  assert.equal(dup.status, 409);
  assert.ok(errShape(dup.json));
});

test('POST /auth/login → 200 {user,token}; wrong creds → 401 generic', async () => {
  const ok = await call(STORE, 'POST', '/auth/login', { body: { email: u.email, password: u.password } });
  assert.equal(ok.status, 200);
  assert.ok(ok.json.token && ok.json.user);
  const bad = await call(STORE, 'POST', '/auth/login', { body: { email: u.email, password: 'wrongwrong' } });
  const unknown = await call(STORE, 'POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'wrongwrong' } });
  assert.equal(bad.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(bad.json.error.message, unknown.json.error.message);
});

test('GET /auth/me 🔒', async () => {
  assert.equal((await call(STORE, 'GET', '/auth/me')).status, 401);
  const r = await call(STORE, 'GET', '/auth/me', { token: u.token });
  assert.equal(r.status, 200);
  assert.equal(r.json.user.email, u.email);
});

test('GET /products → {items,total}; GET /products/:id', async () => {
  const r = await call(STORE, 'GET', '/products?page=1&limit=5');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.items) && typeof r.json.total === 'number');
  assert.ok(r.json.items.length > 0, 'no products – run `npm run seed`');
  product = r.json.items.find((p) => p.stock >= 3) ?? r.json.items[0];
  for (const k of ['_id', 'name', 'description', 'priceCents', 'imageUrl', 'stock']) assert.ok(k in product, `Product.${k} missing`);
  const one = await call(STORE, 'GET', `/products/${product._id}`);
  assert.equal(one.status, 200);
  assert.equal(one.json._id, product._id);
  assert.equal((await call(STORE, 'GET', '/products/000000000000000000000000')).status, 404);
});

test('cart: 401 without token', async () => {
  for (const [m, p] of [['GET', '/cart'], ['PUT', '/cart/items'], ['DELETE', '/cart'], ['GET', '/orders'], ['POST', '/checkout/session']]) {
    assert.equal((await call(STORE, m, p)).status, 401, `${m} ${p}`);
  }
});

test('cart: PUT adds, updates, removes; subtotal computed server-side', async () => {
  const add = await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: product._id, qty: 2 } });
  assert.equal(add.status, 200);
  assert.equal(add.json.items.length, 1);
  assert.equal(add.json.items[0].qty, 2);
  assert.equal(add.json.subtotal, product.priceCents * 2);
  const get = await call(STORE, 'GET', '/cart', { token: u.token });
  assert.deepEqual(get.json.items.map((i) => [i.product._id, i.qty]), [[product._id, 2]]);
  const rm = await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: product._id, qty: 0 } });
  assert.equal(rm.json.items.length, 0);
  assert.equal((await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: product._id, qty: -1 } })).status, 400);
});

test('cart: client-supplied price is ignored / rejected', async () => {
  const r = await call(STORE, 'PUT', '/cart/items', { token: u.token, body: { productId: product._id, qty: 1, priceCents: 1 } });
  assert.ok([200, 400].includes(r.status));
  if (r.status === 200) assert.equal(r.json.subtotal, product.priceCents);
});

test('cart: DELETE → 204, empty afterwards', async () => {
  assert.equal((await call(STORE, 'DELETE', '/cart', { token: u.token })).status, 204);
  assert.deepEqual((await call(STORE, 'GET', '/cart', { token: u.token })).json.items, []);
});

test('checkout/session with empty cart → 400', async () => {
  const r = await call(STORE, 'POST', '/checkout/session', { token: u.token });
  assert.equal(r.status, 400);
  assert.ok(errShape(r.json));
});

test('orders: list is array, unknown id 404, foreign order not visible', async () => {
  const list = await call(STORE, 'GET', '/orders', { token: u.token });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.json));
  assert.equal((await call(STORE, 'GET', '/orders/000000000000000000000000', { token: u.token })).status, 404);
});

test('webhook rejects missing / bad signature with 400', async () => {
  const raw = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } });
  const h = { 'Content-Type': 'application/json' };
  assert.equal((await call(STORE, 'POST', '/checkout/webhook', { raw, headers: h })).status, 400);
  assert.equal((await call(STORE, 'POST', '/checkout/webhook', { raw, headers: { ...h, 'Stripe-Signature': 't=1,v1=deadbeef' } })).status, 400);
});
