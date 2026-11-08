# Store client (Task 4) — Agent 6

React 18 + Vite storefront for the Task 4 API (`http://localhost:5002/api`). Runs on port 5174.

## Run
```bash
cp .env.example .env     # set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
npm install
npm run dev              # http://localhost:5174
npm test
```

## Notes
- Token is stored in `localStorage` (guarded by try/catch) and restored with `GET /auth/me`; any 401 on an authenticated call logs the user out.
- The cart lives on the server; `CartContext` loads it after login and replaces local state with each API response.
- Checkout: `POST /checkout/session` → Stripe `PaymentElement` → `confirmPayment` → `/order-success?orderId=…`, which polls `GET /orders/:id` every 1.5 s for up to 30 s.
- Test card (dev only): `4242 4242 4242 4242`, any future date, any CVC.
