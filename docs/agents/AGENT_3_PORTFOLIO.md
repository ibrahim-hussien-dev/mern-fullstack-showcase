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
