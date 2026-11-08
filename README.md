# MERN Deliverables Monorepo

Task 2 portfolio · Task 3 task dashboard · Task 4 secure store (JWT, bcrypt, persistent cart, Stripe sandbox, inventory).

```
 Browser ──► portfolio (static, :5500)
 Browser ──► task client (Vite :5173) ──fetch──► task API (Express :5001) ──► MongoDB task-dashboard
 Browser ──► store client (Vite :5174) ──fetch──► store API (Express :5002) ──► MongoDB store
                │  Stripe.js (PaymentElement)            ▲   │ PaymentIntent
                └──────────► Stripe (test mode) ─────────┘   ▼
                                  webhook payment_intent.* ──► /api/checkout/webhook
                                  (stock decrement happens ONLY here)
```

## Prerequisites
Node ≥ 20, MongoDB on `127.0.0.1:27017` (`npm run db:up` uses Docker), a Stripe account in **test mode**, and the [Stripe CLI](https://stripe.com/docs/stripe-cli).

## Install
```bash
npm install            # installs every workspace
```

## Environment
Copy each `.env.example` to `.env`.

| File | Key variables |
|---|---|
| `apps/task-dashboard/server/.env` | `PORT=5001`, `MONGO_URI`, `CORS_ORIGIN=http://localhost:5173` |
| `apps/task-dashboard/client/.env` | `VITE_API_URL=http://localhost:5001/api` |
| `apps/store/server/.env` | `PORT=5002`, `MONGO_URI`, `JWT_SECRET` (**≥32 chars**, server won't start otherwise), `CORS_ORIGIN=http://localhost:5174`, `CLIENT_URL`, `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_WEBHOOK_SECRET=whsec_…` |
| `apps/store/client/.env` | `VITE_API_URL=http://localhost:5002/api`, `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…` |

Secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Run
```bash
npm run dev:portfolio   # http://localhost:5500
npm run dev:tasks       # API 5001 + client 5173
npm run dev:store       # API 5002 + client 5174
npm run seed            # sample tasks + 14 products (one with stock 1, one with stock 0)
```

## One-click start / stop (Windows)
`start.cmd` (or `.\start.ps1`) checks MongoDB, installs, creates `.env` files, seeds on first run, launches all 5 services in the background and waits until they respond. `stop.cmd` (or `.\stop.ps1`, add `-Db` to stop Docker Mongo) stops them. Logs: `.run\logs`.

## Stripe sandbox (local webhooks)
```bash
stripe login
stripe listen --forward-to localhost:5002/api/checkout/webhook
# paste the printed whsec_… into apps/store/server/.env → STRIPE_WEBHOOK_SECRET, restart the store API
```
Manual check: register → add to cart → checkout → pay `4242 4242 4242 4242` → order page shows **paid**, product stock −1, cart empty.
Decline run: use `4000 0000 0000 0002` → order `failed`, stock unchanged. (`stripe trigger payment_intent.succeeded` is ignored by design: it isn't linked to one of our orders.)

| Card | Result |
|---|---|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0000 0000 0002 | Generic decline |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires 3-D Secure |

Any future expiry, any CVC, any postcode.

## Tests
```bash
npm run test:unit   # per-package vitest (needs network once: mongodb-memory-server downloads mongod)
npm run test:e2e    # live-server contract + security suite (see e2e/README.md)
E2E_STRIPE=1 STRIPE_WEBHOOK_SECRET=whsec_… npm run test:e2e   # adds webhook/concurrency/idempotency
npm run test:all    # unit + e2e
```
Status of this release: see `docs/INTEGRATION_REPORT.md` (static review done; live runs pending).

## Troubleshooting
- **Store API exits at start** – `JWT_SECRET` missing or <32 chars.
- **CORS error in browser** – `CORS_ORIGIN` must exactly match the client origin (scheme + port).
- **Webhook 400 "Invalid webhook signature"** – `STRIPE_WEBHOOK_SECRET` is stale; `stripe listen` prints a new one each login/session.
- **Order stays `pending`** – `stripe listen` isn't running, or points at the wrong port/path.
- **429 during testing** – auth limiter is 10 req / 15 min / IP; restart the store API.
- **`mongodb-memory-server` download fails** – needs internet on first `npm test`.
- **Empty catalogue** – run `npm run seed`.

## Screenshots
_Placeholders – add after the responsive pass:_ `docs/screenshots/portfolio-{360,768,1280}.png`, `tasks-…`, `store-…`.
