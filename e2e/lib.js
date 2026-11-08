import crypto from 'node:crypto';

export const TASKS = process.env.TASKS_API ?? 'http://localhost:5001/api';
export const STORE = process.env.STORE_API ?? 'http://localhost:5002/api';
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function call(base, method, path, { body, token, headers = {}, raw } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload = raw;
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + path, { method, headers: h, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

export const uniqueEmail = (p = 'e2e') => `${p}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;

export async function register(name = 'E2E User') {
  const email = uniqueEmail();
  const password = 'Passw0rd!e2e';
  const r = await call(STORE, 'POST', '/auth/register', { body: { name, email, password } });
  if (r.status !== 201) throw new Error(`register failed: ${r.status} ${r.text}`);
  return { email, password, token: r.json.token, user: r.json.user };
}

/** Same scheme Stripe uses: t=<ts>,v1=HMAC_SHA256(secret, `${ts}.${payload}`). Lets us replay events without the CLI. */
export function signStripeEvent(payloadString, secret = WEBHOOK_SECRET) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${payloadString}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

export function paymentIntentEvent(type, paymentIntentId) {
  return JSON.stringify({
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    object: 'event',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object: { id: paymentIntentId, object: 'payment_intent' } },
  });
}

export async function sendWebhook(type, paymentIntentId) {
  const payload = paymentIntentEvent(type, paymentIntentId);
  return call(STORE, 'POST', '/checkout/webhook', {
    raw: payload,
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signStripeEvent(payload) },
  });
}

export const errShape = (j) => j && j.error && typeof j.error.message === 'string' && typeof j.error.code === 'string';
