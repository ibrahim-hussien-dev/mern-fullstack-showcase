# /e2e

Zero-dependency suite (`node --test` + built-in `fetch`) that runs against **live** servers.

```bash
# terminals: mongod, tasks api (5001), store api (5002) – both seeded
npm run seed -w apps/task-dashboard/server && npm run seed -w apps/store/server
npm run test:e2e                         # contract + security (no Stripe needed)
E2E_STRIPE=1 STRIPE_WEBHOOK_SECRET=whsec_... npm run test:e2e   # + webhook / concurrency / idempotency
```
`security.test.js` ends by exhausting the auth rate limiter – restart the store server afterwards.
Optional: `TASKS_API`, `STORE_API`, `JWT_SECRET` (enables the forged-expired-token case).
