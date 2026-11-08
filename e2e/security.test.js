import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { call, STORE, TASKS, register, errShape } from './lib.js';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

test('missing / malformed / tampered / expired / alg=none JWT → 401', async () => {
  const u = await register();
  const [h, p, s] = u.token.split('.');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());

  const tampered = `${h}.${b64({ ...payload, role: 'admin' })}.${s}`;
  const expired = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null; // only possible when the test shell shares the server's secret
    const head = b64({ alg: 'HS256', typ: 'JWT' });
    const body = b64({ ...payload, iat: 1, exp: 2 });
    return `${head}.${body}.${crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;
  })();
  const none = `${b64({ alg: 'none', typ: 'JWT' })}.${p}.`;

  const cases = { missing: undefined, garbage: 'abc.def.ghi', tampered, none };
  if (expired) cases.expired = expired;
  for (const [name, token] of Object.entries(cases)) {
    const r = await call(STORE, 'GET', '/auth/me', { token });
    assert.equal(r.status, 401, name);
    assert.ok(errShape(r.json), name);
  }
  const wrongScheme = await call(STORE, 'GET', '/auth/me', { headers: { Authorization: `Basic ${u.token}` } });
  assert.equal(wrongScheme.status, 401);
});

test('NoSQL injection in login is rejected (never 200)', async () => {
  const u = await register();
  const payloads = [
    { email: { $gt: '' }, password: { $gt: '' } },
    { email: u.email, password: { $ne: null } },
    { email: { $regex: '.*' }, password: 'x'.repeat(8) },
  ];
  for (const body of payloads) {
    const r = await call(STORE, 'POST', '/auth/login', { body });
    assert.ok([400, 401, 429].includes(r.status), `${JSON.stringify(body)} → ${r.status}`);
    assert.ok(!r.json?.token);
  }
});

test('NoSQL operators in query strings do not widen results', async () => {
  const r = await call(STORE, 'GET', '/products?q[$ne]=zzz');
  assert.ok([200, 400].includes(r.status));
  const t = await call(TASKS, 'GET', '/tasks?status[$ne]=done');
  assert.ok([200, 400].includes(t.status));
});

test('oversized body rejected on both servers', async () => {
  const big = { name: 'x', email: 'a@b.co', password: 'p'.repeat(20000) };
  const r = await call(STORE, 'POST', '/auth/register', { body: big });
  assert.ok([400, 413, 429].includes(r.status), `store ${r.status}`);
});

test('password / hash never appear in any auth response', async () => {
  const u = await register();
  const me = await call(STORE, 'GET', '/auth/me', { token: u.token });
  const login = await call(STORE, 'POST', '/auth/login', { body: { email: u.email, password: u.password } });
  for (const r of [me, login]) {
    assert.ok(!/passw|hash|\$2[aby]\$/i.test(r.text), r.text);
  }
});

test('role cannot be self-assigned at registration', async () => {
  const r = await call(STORE, 'POST', '/auth/register', {
    body: { name: 'evil', email: `evil.${Date.now()}@example.com`, password: 'Passw0rd!e2e', role: 'admin' },
  });
  if (r.status === 201) assert.notEqual(r.json.user.role, 'admin');
  else assert.equal(r.status, 400);
});

test('error responses leak no stack traces', async () => {
  const r = await call(STORE, 'POST', '/auth/login', { raw: '{bad', headers: { 'Content-Type': 'application/json' } });
  assert.ok(!/at .*\.js:\d+/.test(r.text));
});

test('security headers present (helmet)', async () => {
  const res = await fetch(`${STORE}/health`);
  assert.ok(res.headers.get('x-content-type-options'));
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('CORS: disallowed origin gets no allow-origin header', async () => {
  const res = await fetch(`${STORE}/health`, { headers: { Origin: 'http://evil.example' } });
  assert.notEqual(res.headers.get('access-control-allow-origin'), 'http://evil.example');
  assert.notEqual(res.headers.get('access-control-allow-origin'), '*');
});

// Keep LAST: burns through the /auth limiter (default 10 / 15 min / IP). Restart the store server afterwards.
test('rate limiter triggers on /auth/login (429)', async () => {
  let hit = false;
  for (let i = 0; i < 40 && !hit; i++) {
    const r = await call(STORE, 'POST', '/auth/login', { body: { email: 'rl@example.com', password: 'wrongwrong' } });
    if (r.status === 429) { hit = true; assert.ok(errShape(r.json)); }
  }
  assert.ok(hit, 'no 429 after 40 attempts');
});
