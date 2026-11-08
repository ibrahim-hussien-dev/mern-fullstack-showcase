# SHARED CONTEXT (every agent reads this first)

## Goal
Deliver three MERN-stack deliverables in one monorepo:
- **Task 2** – Responsive single-page portfolio (semantic HTML5, CSS grid/flexbox, media queries, animated mobile nav).
- **Task 3** – Task Dashboard: React frontend + Express API + MongoDB, full CRUD via async/await fetch.
- **Task 4** – Secure E-Commerce: JWT auth, bcrypt-hashed passwords, persistent cart, Stripe sandbox checkout, inventory decrement after successful payment.

## Monorepo layout (FIXED – do not rename)
```
/apps
  /portfolio                 # Task 2 – plain HTML/CSS/JS, no build step
  /task-dashboard
    /server                  # Express + Mongoose  (port 5001)
    /client                  # React + Vite        (port 5173)
  /store
    /server                  # Express + Mongoose  (port 5002)
    /client                  # React + Vite        (port 5174)
/docs                        # API contracts, test notes, final report
/.env.example files per server
README.md
```

## Stack & versions
Node 20+, Express 4, Mongoose 8, MongoDB (local `mongodb://127.0.0.1:27017`), React 18 + Vite, react-router-dom 6, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-validator (or zod), stripe (server), @stripe/stripe-js + @stripe/react-stripe-js (client), dotenv, nodemon, vitest/jest + supertest.

## Global rules
1. **Own only your directories** (listed in your prompt). Never edit another agent's files; request changes via `/docs/HANDOFF.md` (append a dated entry).
2. Use **ES modules** (`"type": "module"`), async/await only (no raw `.then` chains).
3. Every server: `helmet`, `cors` (origin from env), `express.json({limit:"10kb"})`, rate limiting, central error middleware returning `{ "error": { "message", "code" } }`, input validation on every write route.
4. **No secrets in code.** Use `.env` + commit `.env.example`.
5. Frontend never trusts itself: show loading, empty, and error states for every fetch.
6. Accessibility: semantic landmarks, labels on inputs, visible focus, `prefers-reduced-motion` respected.
7. Commit small, with messages `feat(<area>): ...`. Each agent writes a short `DONE.md` section in `/docs/HANDOFF.md` when finished listing: what is built, how to run, known gaps.
8. Definition of done = runs with `npm install && npm run dev`, passes its own tests, matches the API contract exactly.

## API contracts (source of truth – changes need Project Lead approval)

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

## Ports
5001 / 5173 (tasks) · 5002 / 5174 (store) · portfolio served by any static server on 5500.
