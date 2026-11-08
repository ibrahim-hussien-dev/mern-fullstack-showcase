import Stripe from 'stripe';
import { env } from './env.js';

let client;

/** Lazily created so tests can mock this module and the server can boot without a key in tests. */
export function getStripe() {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}
