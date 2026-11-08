# PROMPT — AGENT 5: STORE SERVER (Task 4 API)

## Context (you cannot see the Lead's work — read fully)
MERN monorepo, 3 deliverables: Task 2 portfolio · Task 3 Task Dashboard · Task 4 secure e-commerce. The Project Lead already scaffolded the repo (npm workspaces, Node 20+, ES modules).
Layout (fixed, never rename): `apps/portfolio` (static, :5500) · `apps/task-dashboard/{server :5001, client :5173}` · `apps/store/{server :5002, client :5174}` · `docs/` (`API.md` contracts, `HANDOFF.md` log).
Scaffold already gives you:
- **Servers:** `src/app.js` exports `app` (helmet, CORS from `CLIENT_ORIGIN`, `express.json 10kb`, `/api` rate limit, `GET /api/health`, 404, central error middleware → `{error:{message,code}}`); `src/index.js` (dotenv → mongoose.connect → listen). Extend, never remove. Errors: throw with `err.status` + `err.code`. Mount routers in `app.js`. The default rate limiter replies in plain text — replace its handler/message with `{error:{message:"Too many requests",code:"RATE_LIMITED"}}`.
- **Clients:** Vite + React 18 (`src/main.jsx`, `src/App.jsx`), `VITE_API_URL` in `.env.example`, strictPort.
- **Tests:** vitest (+supertest on servers; +jsdom, @testing-library/react on clients, globals on). From root: `npm install`, `npm run dev:tasks|dev:store|dev:portfolio`, `npm run test:all`. MongoDB at `mongodb://127.0.0.1:27017` (`npm run db:up` = docker).

## Global rules
1. Edit ONLY your owned dirs (+ add deps to your own `package.json`). Need anything else (contract change, other agent's defect, root script) → append to `docs/HANDOFF.md`: `### YYYY-MM-DD · Agent5 → Lead · REQUEST|DEFECT` + precise body. Never edit `docs/API.md`; only the Lead changes contracts. Never silently fix others' code.
2. ES modules, async/await only (no `.then` chains). No secrets in code: `.env` + committed `.env.example`.
3. Validate every write route (express-validator; check types, not just presence). Error bodies exactly `{error:{message,code}}`; validation → 400 `VALIDATION_ERROR` with message `"field: reason; field: reason"`. Standard codes: `INVALID_ID` 400 · `UNAUTHORIZED` 401 · `INVALID_CREDENTIALS` 401 · `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INSUFFICIENT_STOCK` 409 · `EMPTY_CART` 400 · `INVALID_SIGNATURE` 400 · `RATE_LIMITED` 429.
4. Every frontend fetch shows loading, empty and error states (error: `role="alert"` + retry). Never trust the client/server blindly.
5. A11y: semantic landmarks, labelled inputs, visible `:focus-visible`, `prefers-reduced-motion` respected, contrast ≥ 4.5:1.
6. No scope creep: only what is specified below. No UI frameworks/component libraries (plain CSS) unless told.
7. Commit small: `feat(<area>): …`. Done = `npm install && npm run dev` works, your tests pass, behavior matches the contract EXACTLY. Finish with a `DONE` entry in `HANDOFF.md`: **built / how to run / known gaps**. Reply in the log tersely.

## Your scope
Own `apps/store/server` only (:5002). Build the secure e-commerce API. The client (Agent 6) is built in parallel **against the contract below** — match it exactly (shapes, status codes, error codes).

## Contract (exact; source of truth)
### Task 4 – `http://localhost:5002/api` (Bearer JWT where marked 🔒)
| Method | Path | Body | Success |
|---|---|---|---|
| POST | /auth/register | `{name,email,password(≥8)}` | 201 `{user,token}` |
| POST | /auth/login | `{email,password}` | 200 `{user,token}` |
| GET | /auth/me 🔒 | – | 200 `{user}` |
| GET | /products?q=&page=&limit= | – | 200 `{items:[Product], total}` |
| GET | /products/:id | – | 200 `Product` |
| GET | /cart 🔒 | – | 200 `{items:[{product,qty}], subtotal}` |
| PUT | /cart/items 🔒 | `{productId, qty}` (qty 0 removes) | 200 Cart |
| DELETE | /cart 🔒 | – | 204 |
| POST | /checkout/session 🔒 | – | 200 `{clientSecret, orderId}` (Stripe PaymentIntent) |
| POST | /checkout/webhook | Stripe raw body + signature | 200 |
| GET | /orders 🔒 | – | 200 `[Order]` |
| GET | /orders/:id 🔒 | – | 200 `Order` |

`Product = { _id, name, description, priceCents, imageUrl, stock }`
`Order = { _id, user, items:[{product,name,priceCents,qty}], totalCents, status:"pending"|"paid"|"failed", paymentIntentId, createdAt }`

**Inventory rule:** stock is decremented ONLY in the webhook handler on `payment_intent.succeeded`, atomically (`findOneAndUpdate` with `stock: {$gte: qty}`), idempotent per `paymentIntentId`. Order → `paid`, cart cleared. On `payment_intent.payment_failed` → order `failed`, stock untouched. Prices are always recomputed server-side; never trust client prices.

Money is integer cents everywhere. Cart response: `{items:[{product:Product,qty}], subtotal}` (subtotal in cents, computed server-side from current DB prices). Errors: `{error:{message,code}}`.

## Env (`.env.example` already lists them)
`PORT, MONGODB_URI, CLIENT_ORIGIN, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_COST (≥10), STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET`. **Fail fast at boot** if `JWT_SECRET` is missing/short. Stripe in TEST mode only.

## Build
- **Models:** User{name, email unique+lowercase, passwordHash `select:false`}; Product; Cart{user unique, items:[{product ref, qty int ≥1}]}; Order{user, items snapshot [{product,name,priceCents,qty}], totalCents, status pending|paid|failed, paymentIntentId (unique sparse), internal `fulfillment`: none|claimed|done|refunded — hide internal fields from JSON, keep contract fields exact}.
- **Auth:** register (name 1–80, valid email normalized, password 8–72, all `isString`) → duplicate 409 `EMAIL_TAKEN`; bcryptjs hash with cost = max(10, `BCRYPT_COST`); JWT `{sub}` signed `HS256` with `expiresIn`; **verify with `algorithms:["HS256"]`**. Login: generic 401 `INVALID_CREDENTIALS` for unknown email AND bad password (compare against a dummy hash when user missing). `requireAuth`: `Authorization: Bearer`, 401 `UNAUTHORIZED` for missing/invalid/expired token or deleted user. Never return `passwordHash`. Stricter limiter on `/api/auth/*` (env-tunable so tests can disable).
- **Products:** list (`q` regex-escaped, `page`≥1, `limit` default 12 max 50) → `{items,total}`; detail (400 `INVALID_ID`, 404). `npm run seed` (add script): idempotent upsert of ≥8 products (placeholder `imageUrl` like `https://picsum.photos/seed/<n>/400/300`), include one with stock 1 and one with stock 0.
- **Cart (🔒, per user, persisted in Mongo ⇒ survives logout/login):** `PUT /cart/items {productId, qty}` — qty int 0–99, 0 removes, unknown product 404, `qty > stock` → 409 `INSUFFICIENT_STOCK`; returns full Cart. `DELETE /cart` 204. Ignore any client-sent price.
- **Checkout `POST /checkout/session` (🔒):** empty cart → 400 `EMPTY_CART`; re-check stock (409 `INSUFFICIENT_STOCK`); **recompute total from DB prices**; create `pending` Order (snapshot); best-effort cancel the user's earlier pending PaymentIntent and mark that order failed; create PaymentIntent (`amount=totalCents`, `currency:"usd"`, `automatic_payment_methods:{enabled:true, allow_redirects:"never"}`, metadata `{orderId,userId}`, idempotency key per order); save `paymentIntentId`; return `{clientSecret, orderId}`. Put the Stripe client in `src/lib/stripe.js` so tests can `vi.mock` it.
- **Webhook `POST /api/checkout/webhook`:** mount in `app.js` **before** `express.json()` with `express.raw({type:"application/json"})`; no auth; verify with `stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)` → 400 `INVALID_SIGNATURE` on failure. Always 200 for verified events (unknown types ignored).
  - `payment_intent.succeeded` — **no transactions (standalone Mongo)**; use this idempotent protocol: (1) atomically claim: `Order.findOneAndUpdate({paymentIntentId, fulfillment:"none"}, {fulfillment:"claimed"})`; no match ⇒ already handled ⇒ 200 no-op. (2) For each item: `Product.findOneAndUpdate({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})`. (3) If any item fails (oversold): restore the items already decremented, set order `failed` + `fulfillment:"refunded"`, `stripe.refunds.create({payment_intent})`, log. (4) Else set order `paid` + `fulfillment:"done"` and clear the user's cart. **Stock must never go negative; duplicate or concurrent deliveries decrement exactly once.**
  - `payment_intent.payment_failed` — order `pending→failed`; stock untouched.
- **Orders (🔒):** own orders only (newest first); `/orders/:id` of another user's order → 404 (don't leak existence).
- **Security:** all inputs type-validated (reject objects in string fields → NoSQL-injection safe); never log secrets/tokens/passwords; generic 500 messages.

## Tests (vitest+supertest, `mongodb-memory-server` devDep or `store_test` DB; mock `src/lib/stripe.js`; sign webhook bodies with `stripe.webhooks.generateTestHeaderString`)
Stored password is a bcrypt hash (`$2`, ≠ plaintext) · duplicate email · wrong login · protected routes 401 (missing/invalid/expired) · cart persists across re-login, qty 0 removes · client-sent price ignored · session total uses DB prices · **succeeded webhook twice and via `Promise.all` ⇒ stock decremented once** · failed webhook ⇒ stock unchanged · **oversell race: stock 1, two paid orders ⇒ one `paid`, one `failed`+refund, stock = 0** · bad signature 400.

## DONE entry must include
Exact local test recipe: `stripe listen --forward-to localhost:5002/api/checkout/webhook` (put the printed `whsec_` in `.env`), card `4242 4242 4242 4242` any future date/CVC, decline card `4000 0000 0000 0002`; seed command; known gaps (e.g. crash between claim and done).
