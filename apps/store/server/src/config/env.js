import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET ?? '';
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5002,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/store',
  JWT_SECRET: jwtSecret,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5174',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5174',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  BCRYPT_COST: Number(process.env.BCRYPT_COST) || 12,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  GLOBAL_RATE_LIMIT_MAX: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 300,
};
