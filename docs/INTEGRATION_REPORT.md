# Integration Report

**Status: NOT YET VERIFIED LIVE.** The integration sandbox had no network, so `npm install`, MongoDB, Stripe and browsers were unavailable. Rows marked *static* come from code reading; *pending* need a live run (`npm run test:e2e`). Nothing here has been executed.

| # | Scenario | Expected | Actual | Owner if failing |
|---|---|---|---|---|
| 1 | Tasks contract (all 6 endpoints, shapes, 400/404) | per `API.md` | pending (`e2e/contract.tasks.test.js`); static: routes/validation match | – |
| 2 | Store contract (auth, products, cart, orders) | per `API.md` | pending (`e2e/contract.store.test.js`); static: match | – |
| 3 | Env alignment | one name per setting across servers/docs | Both servers use `CORS_ORIGIN`, `MONGO_URI` (matches README). Scaffold's `CLIENT_ORIGIN`/`MONGODB_URI` are gone. `CLIENT_URL` in store `.env.example` is defined but unused in code I read | Agent 5 (minor) |
| 4 | Webhook mounted before `express.json()` with raw body | yes | static: **pass** | – |
| 5 | Stock decrement only in webhook, atomic, idempotent | yes | static: **pass** (`$gte` guard, claim flag) | – |
| 6 | Pay 4242 → paid, stock −1, cart empty | yes | pending (manual + `stripe-flow.test.js`) | – |
| 7 | Decline `4000 0000 0000 0002` → failed, stock unchanged | yes | pending; static: logic OK | – |
| 8 | **Decline, then retry same PaymentIntent with good card** | order paid, stock −1 | static: **FAIL** – `payment_failed` sets order `failed`; later `succeeded` only claims `status:'pending'` so it is skipped: customer charged, no order, no decrement (probe in `stripe-flow.test.js`) | Agent 5 (DEFECT 1) |
| 9 | Webhook arrives before `paymentIntentId` is saved | order paid | static: tiny race – `order.save()` with the id happens after `paymentIntents.create`; an early event is skipped | Agent 5 (DEFECT 2, low) |
| 10 | Concurrency: 2 checkouts for last unit | 1 paid, 1 failed + refund, stock 0 | pending (`concurrency.test.js`); static: guard correct | – |
| 11 | JWT missing/tampered/expired/alg=none → 401 | 401 | pending; static: `algorithms:['HS256']` pinned | – |
| 12 | NoSQL injection in login | rejected | pending; static: zod string types + mongo-sanitize | – |
| 13 | Oversized body | 400/413 | pending; 10kb limit on both | – |
| 14 | Password never returned | none | pending; static: `select:false` hash | – |
| 15 | Rate limiter | 429 | Store: pending. **Tasks: 100/15 min global, skipped when `NODE_ENV=test`** – note e2e + dev use can hit it | – |
| 16 | Stale scaffold tests | none | `apps/*/client/tests/App.test.jsx` still render the old hello `App` without providers → likely fail `npm test`; `apps/*/server/tests/health.test.js` also leftover (excluded by store/task vitest config) | Agent 4 & 6 (DEFECT 3) |
| 17 | Test card doc | contract says `…0002` | Agent 5 notes `…9995`; README lists both | – |
| 18 | Responsive 360/768/1280 (portfolio + 2 clients) | no overflow | pending (needs browser) | 3 / 4 / 6 |
| 19 | Portfolio Lighthouse / W3C | pass | pending (Agent 3 also flagged) | 3 |
