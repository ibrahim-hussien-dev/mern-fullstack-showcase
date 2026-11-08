import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { authLimiter, globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { webhook } from './controllers/checkout.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import checkoutRoutes from './routes/checkout.js';
import orderRoutes from './routes/orders.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()) }));

  // Stripe webhook: raw body (signature verification) – MUST be before express.json().
  app.post('/api/checkout/webhook', express.raw({ type: 'application/json', limit: '1mb' }), webhook);

  app.use(express.json({ limit: '10kb' }));
  app.use(mongoSanitize()); // strips $-operators / dotted keys from body, query, params
  app.use(globalLimiter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/orders', orderRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
