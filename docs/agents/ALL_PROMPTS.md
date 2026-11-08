# ALL AGENT PROMPTS — paste each section into its own agent session

**Dispatch order:** Agents 3, 4, 5, 6 in parallel (independent) → Agent 2 after all four log `DONE` → Lead runs Phase 3 acceptance (`docs/ACCEPTANCE.md`) using `01_PROJECT_LEAD.md`.
Each section is self-contained (no repo access needed to understand the context).



---

# PROMPT — AGENT 3: PORTFOLIO (Task 2)

## Context (you cannot see the Lead's work — read fully)
MERN monorepo, 3 deliverables: Task 2 portfolio · Task 3 Task Dashboard · Task 4 secure e-commerce. The Project Lead already scaffolded the repo (npm workspaces, Node 20+, ES modules).
Layout (fixed, never rename): `apps/portfolio` (static, :5500) · `apps/task-dashboard/{server :5001, client :5173}` · `apps/store/{server :5002, client :5174}` · `docs/` (`API.md` contracts, `HANDOFF.md` log).
Scaffold already gives you:
- **Servers:** `src/app.js` exports `app` (helmet, CORS from `CLIENT_ORIGIN`, `express.json 10kb`, `/api` rate limit, `GET /api/health`, 404, central error middleware → `{error:{message,code}}`); `src/index.js` (dotenv → mongoose.connect → listen). Extend, never remove. Errors: throw with `err.status` + `err.code`. Mount routers in `app.js`. The default rate limiter replies in plain text — replace its handler/message with `{error:{message:"Too many requests",code:"RATE_LIMITED"}}`.
- **Clients:** Vite + React 18 (`src/main.jsx`, `src/App.jsx`), `VITE_API_URL` in `.env.example`, strictPort.
- **Tests:** vitest (+supertest on servers; +jsdom, @testing-library/react on clients, globals on). From root: `npm install`, `npm run dev:tasks|dev:store|dev:portfolio`, `npm run test:all`. MongoDB at `mongodb://127.0.0.1:27017` (`npm run db:up` = docker).

## Global rules
1. Edit ONLY your owned dirs (+ add deps to your own `package.json`). Need anything else (contract change, other agent's defect, root script) → append to `docs/HANDOFF.md`: `### YYYY-MM-DD · Agent3 → Lead · REQUEST|DEFECT` + precise body. Never edit `docs/API.md`; only the Lead changes contracts. Never silently fix others' code.
2. ES modules, async/await only (no `.then` chains). No secrets in code: `.env` + committed `.env.example`.
3. Validate every write route (express-validator; check types, not just presence). Error bodies exactly `{error:{message,code}}`; validation → 400 `VALIDATION_ERROR` with message `"field: reason; field: reason"`. Standard codes: `INVALID_ID` 400 · `UNAUTHORIZED` 401 · `INVALID_CREDENTIALS` 401 · `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INSUFFICIENT_STOCK` 409 · `EMPTY_CART` 400 · `INVALID_SIGNATURE` 400 · `RATE_LIMITED` 429.
4. Every frontend fetch shows loading, empty and error states (error: `role="alert"` + retry). Never trust the client/server blindly.
5. A11y: semantic landmarks, labelled inputs, visible `:focus-visible`, `prefers-reduced-motion` respected, contrast ≥ 4.5:1.
6. No scope creep: only what is specified below. No UI frameworks/component libraries (plain CSS) unless told.
7. Commit small: `feat(<area>): …`. Done = `npm install && npm run dev` works, your tests pass, behavior matches the contract EXACTLY. Finish with a `DONE` entry in `HANDOFF.md`: **built / how to run / known gaps**. Reply in the log tersely.

## Your scope
Own `apps/portfolio/` only (plain HTML/CSS/JS, **no build step**, no frameworks, no external requests/CDNs/fonts — system font stack; use inline SVG/CSS for imagery). Served by `npm run dev:portfolio` (:5500). Delete the hello placeholders and build the real page.

## Build: one responsive single-page portfolio
Files: `index.html`, `css/styles.css`, `js/main.js` (vanilla, `defer`).
**Structure (semantic):** skip link → `<header>` (brand + `<nav aria-label="Primary">`) → `<main>` with `<section>`s (id'd, each with `aria-labelledby` heading): Hero/About · Skills · Projects (≥3 `<article>` cards) · Contact → `<footer>`. One `<h1>`, logical heading order, `<html lang="en">`, meta description/viewport, realistic but obviously editable placeholder copy ("Your Name").
**Layout:** mobile-first. CSS Grid for skills + projects (`repeat(auto-fit, minmax(…,1fr))`) and page sections; Flexbox for header/nav/footer/buttons. Media queries at ~600px and ~900px. CSS custom properties for colors/spacing, fluid type with `clamp()`. Must work **320px–1920px with zero horizontal scroll** (container `max-width`, `img/svg {max-width:100%}`, `overflow-wrap:anywhere`, long words/URLs safe).
**Mobile nav (animated hamburger):** `<button>` with `aria-expanded`, `aria-controls`, `aria-label` that toggles. Below the desktop breakpoint the menu slides/fades via CSS `transform/opacity` transitions and the icon morphs into an X. Closes on: link click, `Esc` (return focus to the button), click outside. Menu links not focusable while hidden (`visibility:hidden`/`inert`). **Progressive enhancement:** without JS the nav stays visible/usable. Desktop (≥ breakpoint): inline horizontal nav, button hidden.
**Contact form:** labelled fields (name, email, message), client-side validation with inline `aria-describedby` errors and an `aria-live` success message; no backend (just show the success state).
**Polish:** `scroll-behavior:smooth` + `scroll-margin-top` for sticky header; `:focus-visible` rings; hover/active states; `@media (prefers-reduced-motion: reduce)` disables transitions/smooth scroll; descriptive `alt`/`aria-hidden` on decorative SVG; semantic `<ul>` for lists.

## Acceptance (Lead will check)
Landmarks `header, nav, main, section, article, footer` present · Grid AND Flexbox used · no horizontal scroll 320→1920 · hamburger animates, `aria-expanded` correct, closes on link/Esc · Lighthouse accessibility ≥ 90. If a headless browser is available, screenshot at 320/768/1280/1920 and run Lighthouse; else self-audit this list and say so in `DONE`.


---

# PROMPT — AGENT 4: TASK DASHBOARD (Task 3: server + client)

## Context (you cannot see the Lead's work — read fully)
MERN monorepo, 3 deliverables: Task 2 portfolio · Task 3 Task Dashboard · Task 4 secure e-commerce. The Project Lead already scaffolded the repo (npm workspaces, Node 20+, ES modules).
Layout (fixed, never rename): `apps/portfolio` (static, :5500) · `apps/task-dashboard/{server :5001, client :5173}` · `apps/store/{server :5002, client :5174}` · `docs/` (`API.md` contracts, `HANDOFF.md` log).
Scaffold already gives you:
- **Servers:** `src/app.js` exports `app` (helmet, CORS from `CLIENT_ORIGIN`, `express.json 10kb`, `/api` rate limit, `GET /api/health`, 404, central error middleware → `{error:{message,code}}`); `src/index.js` (dotenv → mongoose.connect → listen). Extend, never remove. Errors: throw with `err.status` + `err.code`. Mount routers in `app.js`. The default rate limiter replies in plain text — replace its handler/message with `{error:{message:"Too many requests",code:"RATE_LIMITED"}}`.
- **Clients:** Vite + React 18 (`src/main.jsx`, `src/App.jsx`), `VITE_API_URL` in `.env.example`, strictPort.
- **Tests:** vitest (+supertest on servers; +jsdom, @testing-library/react on clients, globals on). From root: `npm install`, `npm run dev:tasks|dev:store|dev:portfolio`, `npm run test:all`. MongoDB at `mongodb://127.0.0.1:27017` (`npm run db:up` = docker).

## Global rules
1. Edit ONLY your owned dirs (+ add deps to your own `package.json`). Need anything else (contract change, other agent's defect, root script) → append to `docs/HANDOFF.md`: `### YYYY-MM-DD · Agent4 → Lead · REQUEST|DEFECT` + precise body. Never edit `docs/API.md`; only the Lead changes contracts. Never silently fix others' code.
2. ES modules, async/await only (no `.then` chains). No secrets in code: `.env` + committed `.env.example`.
3. Validate every write route (express-validator; check types, not just presence). Error bodies exactly `{error:{message,code}}`; validation → 400 `VALIDATION_ERROR` with message `"field: reason; field: reason"`. Standard codes: `INVALID_ID` 400 · `UNAUTHORIZED` 401 · `INVALID_CREDENTIALS` 401 · `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INSUFFICIENT_STOCK` 409 · `EMPTY_CART` 400 · `INVALID_SIGNATURE` 400 · `RATE_LIMITED` 429.
4. Every frontend fetch shows loading, empty and error states (error: `role="alert"` + retry). Never trust the client/server blindly.
5. A11y: semantic landmarks, labelled inputs, visible `:focus-visible`, `prefers-reduced-motion` respected, contrast ≥ 4.5:1.
6. No scope creep: only what is specified below. No UI frameworks/component libraries (plain CSS) unless told.
7. Commit small: `feat(<area>): …`. Done = `npm install && npm run dev` works, your tests pass, behavior matches the contract EXACTLY. Finish with a `DONE` entry in `HANDOFF.md`: **built / how to run / known gaps**. Reply in the log tersely.

## Your scope
Own `apps/task-dashboard/server` and `apps/task-dashboard/client`. Goal: Task Dashboard with **full CRUD via async/await fetch against real MongoDB**, validation errors visible in the UI, data persisting across restarts. Server :5001, client :5173.

## Contract (exact; source of truth)
### Task 3 – `http://localhost:5001/api`
| Method | Path | Body | Success |
|---|---|---|---|
| GET | /tasks?status=&q=&page=&limit= | – | 200 `{items:[Task], total, page}` |
| POST | /tasks | `{title, description?, status?, priority?, dueDate?}` | 201 `Task` |
| GET | /tasks/:id | – | 200 `Task` |
| PATCH | /tasks/:id | partial Task | 200 `Task` |
| DELETE | /tasks/:id | – | 204 |
| GET | /health | – | 200 `{ok:true}` |

`Task = { _id, title(1-120), description(≤1000), status: "todo"|"in_progress"|"done", priority: "low"|"medium"|"high", dueDate?, createdAt, updatedAt }`

Errors everywhere: `{error:{message,code}}`.

## Server
- `src/models/Task.js`: title (required, trimmed, 1–120), description (≤1000, default ""), status enum default `todo`, priority enum default `medium`, dueDate (Date, optional/nullable), `timestamps`. Hide `__v`. Index `{status:1, createdAt:-1}`.
- `src/routes/tasks.js` mounted at `/api/tasks`. List: `status` filter (validate enum), `q` = case-insensitive match on title/description with **regex-escaped** input (no injection/ReDoS), `page` ≥1 (default 1), `limit` 1–50 (default 10), sort `createdAt` desc → `{items,total,page}`.
- Bad ObjectId → 400 `INVALID_ID`; missing → 404 `NOT_FOUND`. POST/PATCH: whitelist fields only (no mass assignment), types validated, `dueDate` ISO8601 (PATCH accepts `null` to clear), empty PATCH → 400, `runValidators:true, new:true`. DELETE → 204 empty body.
- Tests (vitest+supertest; use `mongodb-memory-server` devDep, or a separate `task_dashboard_test` DB): CRUD happy paths, validation failures, pagination/filter/search, invalid id, 404, error shape, health.

## Client (React, no UI libs, one `styles.css`)
- `src/api.js`: thin fetch wrapper (async/await, `VITE_API_URL`, JSON, handles 204, converts `{error:{message}}` into thrown `Error`).
- UI: `<header>`/`<main>` landmarks; status filter (All/To do/In progress/Done); debounced (300 ms) search; pagination; task cards with status + priority badges and due date (highlight overdue); **create** form (title, description, status, priority, due date); **edit** (inline or `<dialog>`); quick status change; **delete** with confirm.
- States: list loading (`aria-busy`/skeleton), empty (with "create your first task" CTA), error (alert + Retry). Mutations: disable controls while pending, show server validation message in a `role="alert"` near the form, client-side check (title 1–120) before submit, `aria-live="polite"` region for "Task created/updated/deleted". Cancel stale list fetches (`AbortController`). Manage focus after create/edit/delete. Responsive, `prefers-reduced-motion` respected.
- Tests (RTL, `vi.stubGlobal('fetch')`): list render, empty, error+retry, create flow, delete flow.

## Acceptance
All 5 CRUD ops work from the UI; validation errors surface; data survives server restart; helmet/rate-limit/CORS present; `npm run test:all` green for your two packages.


---

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


---

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


---

# PROMPT — AGENT 2: INTEGRATION & QA

## Context (you cannot see the Lead's work — read fully)
MERN monorepo, 3 deliverables: Task 2 portfolio · Task 3 Task Dashboard · Task 4 secure e-commerce. The Project Lead already scaffolded the repo (npm workspaces, Node 20+, ES modules).
Layout (fixed, never rename): `apps/portfolio` (static, :5500) · `apps/task-dashboard/{server :5001, client :5173}` · `apps/store/{server :5002, client :5174}` · `docs/` (`API.md` contracts, `HANDOFF.md` log).
Scaffold already gives you:
- **Servers:** `src/app.js` exports `app` (helmet, CORS from `CLIENT_ORIGIN`, `express.json 10kb`, `/api` rate limit, `GET /api/health`, 404, central error middleware → `{error:{message,code}}`); `src/index.js` (dotenv → mongoose.connect → listen). Extend, never remove. Errors: throw with `err.status` + `err.code`. Mount routers in `app.js`. The default rate limiter replies in plain text — replace its handler/message with `{error:{message:"Too many requests",code:"RATE_LIMITED"}}`.
- **Clients:** Vite + React 18 (`src/main.jsx`, `src/App.jsx`), `VITE_API_URL` in `.env.example`, strictPort.
- **Tests:** vitest (+supertest on servers; +jsdom, @testing-library/react on clients, globals on). From root: `npm install`, `npm run dev:tasks|dev:store|dev:portfolio`, `npm run test:all`. MongoDB at `mongodb://127.0.0.1:27017` (`npm run db:up` = docker).

## Global rules
1. Edit ONLY your owned dirs (+ add deps to your own `package.json`). Need anything else (contract change, other agent's defect, root script) → append to `docs/HANDOFF.md`: `### YYYY-MM-DD · Agent2 → Lead · REQUEST|DEFECT` + precise body. Never edit `docs/API.md`; only the Lead changes contracts. Never silently fix others' code.
2. ES modules, async/await only (no `.then` chains). No secrets in code: `.env` + committed `.env.example`.
3. Validate every write route (express-validator; check types, not just presence). Error bodies exactly `{error:{message,code}}`; validation → 400 `VALIDATION_ERROR` with message `"field: reason; field: reason"`. Standard codes: `INVALID_ID` 400 · `UNAUTHORIZED` 401 · `INVALID_CREDENTIALS` 401 · `NOT_FOUND` 404 · `EMAIL_TAKEN` 409 · `INSUFFICIENT_STOCK` 409 · `EMPTY_CART` 400 · `INVALID_SIGNATURE` 400 · `RATE_LIMITED` 429.
4. Every frontend fetch shows loading, empty and error states (error: `role="alert"` + retry). Never trust the client/server blindly.
5. A11y: semantic landmarks, labelled inputs, visible `:focus-visible`, `prefers-reduced-motion` respected, contrast ≥ 4.5:1.
6. No scope creep: only what is specified below. No UI frameworks/component libraries (plain CSS) unless told.
7. Commit small: `feat(<area>): …`. Done = `npm install && npm run dev` works, your tests pass, behavior matches the contract EXACTLY. Finish with a `DONE` entry in `HANDOFF.md`: **built / how to run / known gaps**. Reply in the log tersely.

## Your scope
You START ONLY AFTER Agents 4, 5, 6 (and 3) log `DONE` in `HANDOFF.md`. You own `/e2e/` (new dir — allowed), `docs/TESTING.md`, `docs/FINAL_REPORT.md`, and the body of root `README.md`. Everything else is read-only: defects go to the owner as `DEFECT` entries (precise repro + expected vs actual); root script changes (e.g. `test:e2e`) go to the Lead as `REQUEST`. Never fix others' code.

## Do (in order, stop-and-report on blockers)
1. **Fresh-clone check:** clean `node_modules`, `npm install`, `npm run test:all`, then `npm run dev:tasks`, `dev:store`, `dev:portfolio` all start. Record output.
2. **Contract conformance** vs `docs/API.md` (below): status codes, response shapes, error shape `{error:{message,code}}`, CORS from 5173→5001 and 5174→5002, helmet headers present, rate limiter reply shape.
3. **E2E scripts in `/e2e`** (Node 20 `fetch`, zero heavy deps; `node e2e/<file>.js`; print PASS/FAIL per check; non-zero exit on failure):
   - `tasks.e2e.js`: create → list → get → patch → delete; validation 400s; persistence (data readable after restarting the server, documented manual step).
   - `store.e2e.js` (needs Stripe test keys + `stripe listen`; if absent, use signed-webhook simulation and say so): register/login · wrong login · protected routes 401 (none/garbage/expired) · cart persists across logout/login · **successful payment** (server-side confirm PaymentIntent with `pm_card_visa`) ⇒ order `paid` and stock decreased exactly by qty · **declined** (`pm_card_chargeDeclined`) ⇒ order `failed`, stock unchanged · **replay same webhook event twice** ⇒ stock decremented once · **oversell race**: product stock 1, two users pay concurrently ⇒ stock never < 0, exactly one `paid` · client-sent price ignored · another user's order ⇒ 404 · DB check: `passwordHash` starts with `$2` and cost ≥ 10.
   - Optional UI smoke (Playwright) only if browsers install offline-safe; otherwise skip and note.
4. **Docs:** `README.md` (prereqs, env setup per package, Stripe CLI webhook forwarding, seed, run, test, ports, troubleshooting); `docs/TESTING.md` (how to run every test/E2E, cards, expected output); `docs/FINAL_REPORT.md` (architecture diagram in ASCII, per-task summary, security measures list, requirement→evidence map, known gaps).
5. **Report to Lead:** `DONE` entry with a pass/fail table and raw evidence (commands + output excerpts) so the Lead can fill `docs/ACCEPTANCE.md`.

## Contracts to verify against
### Task 3 – `http://localhost:5001/api`
| Method | Path | Body | Success |
|---|---|---|---|
| GET | /tasks?status=&q=&page=&limit= | – | 200 `{items:[Task], total, page}` |
| POST | /tasks | `{title, description?, status?, priority?, dueDate?}` | 201 `Task` |
| GET | /tasks/:id | – | 200 `Task` |
| PATCH | /tasks/:id | partial Task | 200 `Task` |
| DELETE | /tasks/:id | – | 204 |
| GET | /health | – | 200 `{ok:true}` |

`Task = { _id, title(1-120), description(≤1000), status: "todo"|"in_progress"|"done", priority: "low"|"medium"|"high", dueDate?, createdAt, updatedAt }`

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
