import mongoose from 'mongoose';
import { env } from './config/env.js';
import { createApp } from './app.js';

for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']) {
  if (!env[name]) throw new Error(`${name} must be set (see .env.example)`);
}

await mongoose.connect(env.MONGO_URI);
const server = createApp().listen(env.PORT, () => {
  console.log(`Store API listening on http://localhost:${env.PORT}/api`);
});

const shutdown = async () => {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
