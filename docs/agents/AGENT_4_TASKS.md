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
