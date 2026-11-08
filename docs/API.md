# API Contracts

> Copied from the shared context. **Only the Project Lead may change this file.** Request changes via `HANDOFF.md`.
> Error shape on every server: `{ "error": { "message": string, "code": string } }`


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

