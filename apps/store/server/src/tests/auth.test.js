import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { bearer, clearDb, registerUser, startDb, stopDb } from './helpers.js';

const app = createApp();

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('auth', () => {
  it('registers a user, returns a token and never returns or stores the plain password', async () => {
    const { res, credentials } = await registerUser(app);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Test User', email: credentials.email, role: 'user' });
    expect(res.body.user.passwordHash).toBeUndefined();

    const stored = await User.findOne({ email: credentials.email }).select('+passwordHash').lean();
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt
    expect(stored.passwordHash).not.toContain(credentials.password);

    const decoded = jwt.decode(res.body.token, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload).toMatchObject({ sub: res.body.user._id, role: 'user' });
  });

  it('ignores a client-supplied role', async () => {
    const { res } = await registerUser(app, { role: 'admin' });
    expect(res.body.user.role).toBe('user');
  });

  it('rejects short passwords and bad emails with 400', async () => {
    const short = await request(app).post('/api/auth/register').send({ name: 'A', email: 'a@b.com', password: 'short' });
    expect(short.status).toBe(400);
    expect(short.body.error.code).toBe('VALIDATION_ERROR');
    const bad = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: 'password123' });
    expect(bad.status).toBe(400);
  });

  it('rejects duplicate emails with 409', async () => {
    const { credentials } = await registerUser(app);
    const dup = await request(app).post('/api/auth/register').send(credentials);
    expect(dup.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const { credentials } = await registerUser(app);
    const res = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(credentials.email);
  });

  it('returns the same generic 401 for wrong password and unknown email', async () => {
    const { credentials } = await registerUser(app);
    const wrongPw = await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'wrong-password' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'password123' });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.error.message).toBe('Invalid credentials');
    expect(unknown.body).toEqual(wrongPw.body);
  });

  it('blocks NoSQL operator injection on login', async () => {
    await registerUser(app);
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('protects /auth/me: no token, garbage token, wrong-secret token and unsigned token are 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(bearer('garbage'))).status).toBe(401);

    const { user } = await registerUser(app);
    const forged = jwt.sign({ sub: user._id, role: 'admin' }, 'x'.repeat(40), { algorithm: 'HS256' });
    expect((await request(app).get('/api/auth/me').set(bearer(forged))).status).toBe(401);

    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: user._id, role: 'admin' }),
    ).toString('base64url')}.`;
    expect((await request(app).get('/api/auth/me').set(bearer(unsigned))).status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser(app);
    const res = await request(app).get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id);
  });
});
