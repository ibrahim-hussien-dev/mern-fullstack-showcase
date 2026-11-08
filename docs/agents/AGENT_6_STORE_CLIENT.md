# PROMPT — AGENT 6: STORE CLIENT (Task 4 UI)

## Context (you cannot see the Lead's work — read fully)
MERN monorepo, 3 deliverables: Task 2 portfolio · Task 3 Task Dashboard · Task 4 secure e-commerce. The Project Lead already scaffolded the repo (npm workspaces, Node 20+, ES modules).
Layout (fixed, never rename): `apps/portfolio` (static, :5500) · `apps/task-dashboard/{server :5001, client :5173}` · `apps/store/{server :5002, client :5174}` · `docs/` (`API.md` contracts, `HANDOFF.md` log).
Scaffold already gives you:
- **Servers:** `src/app.js` exports `app` (helmet, CORS from `CLIENT_ORIGIN`, `express.json 10kb`, `/api` rate limit, `GET /api/health`, 404, central error middleware → `{error:{message,code}}`); `src/index.js` (dotenv → mongoose.connect → listen). Extend, never remove. Errors: throw with `err.status` + `err.code`. Mount routers in `app.js`. The default rate limiter replies in plain text — replace its handler/message with `{error:{message:"Too many requests",code:"RATE_LIMITED"}}`.
- **Clients:** Vite + React 18 (`src/main.jsx`, `src/App.jsx`), `VITE_API_URL` in `.env.example`, strictPort.
- **Tests:** vitest (+supertest on servers; +jsdom, @testing-library/react on clients, globals on). From root: `npm install`, `npm run dev:tasks|dev:store|dev:portfolio`, `npm run test:all`. MongoDB at `mongodb://127.0.0.1:27017` (`npm run db:up` = docker).

## Global rules
1. Edit ONLY your owned dirs (+ add deps to your own `package.json`). Need anything else (contract change, other agent's defect, root script) → append to `docs/HANDOFF.md`: `### YYYY-MM-DD · Agent6 → Lead · REQUEST|DEFECT` + precise body. Never edit `docs/API.md`; only the Lead changes contracts. Never silently fix others' code.
2. ES modules, async/await only (no `.then` chains). No secrets in code: `.env` + committed `.env.example`.
3. Validate every write route (express-validator; check types, not just presence). Error bodies exactly `{error:{message,code}}`; validation → 400 `VALIDATION_ERROR` with message `"field: reason; field: reason"`. Standard codes: `INVALID_ID` 400 · `UNAUTHORIZED` 401 · `INVALID_CREDENTIALS` 401 · `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INSUFFICIENT_STOCK` 409 · `EMPTY_CART` 400 · `INVALID_SIGNATURE` 400 · `RATE_LIMITED` 429.
4. Every frontend fetch shows loading, empty and error states (error: `role="alert"` + retry). Never trust the client/server blindly.
5. A11y: semantic landmarks, labelled inputs, visible `:focus-visible`, `prefers-reduced-motion` respected, contrast ≥ 4.5:1.
6. No scope creep: only what is specified below. No UI frameworks/component libraries (plain CSS) unless told.
7. Commit small: `feat(<area>): …`. Done = `npm install && npm run dev` works, your tests pass, behavior matches the contract EXACTLY. Finish with a `DONE` entry in `HANDOFF.md`: **built / how to run / known gaps**. Reply in the log tersely.

## Your scope
Own `apps/store/client` only (:5174). React 18 + Vite + react-router-dom 6 + `@stripe/stripe-js` + `@stripe/react-stripe-js` (already in package.json). The server (Agent 5) is built in parallel **against this contract — code strictly to it**; if the real server deviates, log a `DEFECT` to the Lead, don't work around it silently. In tests, stub `fetch` (`vi.stubGlobal`).

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

Money = integer cents (format with `Intl.NumberFormat`, USD). Cart response: `{items:[{product:Product,qty}], subtotal}`. Errors `{error:{message,code}}`, codes you must handle: `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `VALIDATION_ERROR`, `INSUFFICIENT_STOCK`, `EMPTY_CART`, `NOT_FOUND`, `RATE_LIMITED`.

## Build
- `src/api.js`: fetch wrapper (async/await, `VITE_API_URL`, JSON, `Authorization: Bearer`, handles 204, throws `{message,code,status}`). **Never send prices**; display only server values. Any 401 on a protected call ⇒ clear session, redirect `/login` with return path.
- **Auth:** `AuthContext`; token kept in `sessionStorage` (not localStorage), validated via `GET /auth/me` on load; Login/Register pages (labelled fields, `autocomplete`, password ≥8 hint, server error in `role="alert"`, disabled while pending); logout. `ProtectedRoute` for `/cart`, `/checkout`, `/orders`, `/orders/:id`.
- **Routes:** `/` product grid (search `q`, pagination, card: image with alt, name, price, stock badge: "Out of stock" disables add, "Only N left" when ≤5) · `/products/:id` detail · `/cart` (qty stepper → `PUT /cart/items`, remove = qty 0, subtotal, handle 409 `INSUFFICIENT_STOCK` with a clear message) · `/checkout` · `/orders` · `/orders/:id` · `/login` · `/register` · 404. Header with `<nav>`, cart count badge (from `CartContext`, refetched after changes/login), login/logout state. Add-to-cart while logged out ⇒ go to login, then return.
- **Checkout:** on mount `POST /checkout/session` **exactly once** (guard React StrictMode double effect with a ref/abort) → `clientSecret`. `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)` once at module scope; `<Elements options={{clientSecret}}>` + `PaymentElement`; show order summary from `GET /cart`; Pay button disabled while submitting; `stripe.confirmPayment({elements, redirect:"if_required"})`; show Stripe error text in `role="alert"` and allow retry (declined card ⇒ stays on page). Visible hint: test card `4242 4242 4242 4242`, any future date, any CVC. On success navigate to `/orders/:id`, which **polls** `GET /orders/:id` every 1.5 s (max ~30 s) until `paid`/`failed` (the webhook is asynchronous): show "Processing payment…", then confirmation or failure; refetch cart afterwards (server clears it).
- Every fetch: loading / empty (e.g. empty cart with link to shop) / error (+Retry). Plain responsive CSS (mobile-first grid), `:focus-visible`, `prefers-reduced-motion`, labelled controls, semantic landmarks, `aria-live` for cart updates.
- Tests (RTL + stubbed fetch): product list loading/empty/error, protected-route redirect, cart qty update + 409 message, api error parsing, order polling reaches `paid`.

## Acceptance
Register/login works; cart persists after logout/login (server-side); test card completes and order shows `paid`; failed card shows error and allows retry; no price ever sent from the client; no console errors; `npm run test:all` green for your package.
