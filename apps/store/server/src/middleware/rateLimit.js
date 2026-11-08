import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const handler = (_req, res) =>
  res.status(429).json({ error: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' } });

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Stricter limiter for /auth/* (default 10 requests / 15 min / IP). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
