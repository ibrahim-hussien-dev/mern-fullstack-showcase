import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrder } from "../api/orders.js";
import { useCart } from "../context/CartContext.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatCents } from "../utils/format.js";

const POLL_MS = 1500;
const MAX_MS = 30000;

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const { refresh } = useCart();
  const [state, setState] = useState({ phase: orderId ? "polling" : "missing", order: null, error: null });
  const refreshed = useRef(false);

  // The webhook is async, so poll until the order leaves "pending".
  useEffect(() => {
    if (!orderId) return undefined;
    let active = true;
    let timer;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const order = await getOrder(orderId);
        if (!active) return;
        if (order.status === "paid" || order.status === "failed") {
          setState({ phase: order.status, order, error: null });
          return;
        }
        setState({ phase: "polling", order, error: null });
      } catch (err) {
        if (!active) return;
        if (err.status === 404) {
          setState({ phase: "error", order: null, error: "We couldn’t find this order." });
          return;
        }
        // transient error: keep trying until the deadline
        setState((s) => ({ ...s, error: err.message }));
      }
      if (Date.now() - startedAt >= MAX_MS) {
        setState((s) => ({ ...s, phase: "timeout" }));
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => { active = false; clearTimeout(timer); };
  }, [orderId]);

  // Refresh the cart once the outcome is known (the webhook clears it on success).
  useEffect(() => {
    if ((state.phase === "paid" || state.phase === "failed") && !refreshed.current) {
      refreshed.current = true;
      refresh();
    }
  }, [state.phase, refresh]);

  const { phase, order } = state;

  return (
    <section aria-labelledby="success-title" className="auth">
      {phase === "polling" && (
        <>
          <h1 id="success-title">Confirming your payment</h1>
          <Spinner label="Waiting for confirmation" />
          <p className="muted">This usually takes a few seconds. Keep this page open.</p>
        </>
      )}

      {phase === "paid" && (
        <>
          <h1 id="success-title">Payment received</h1>
          <p className="notice notice-ok" role="status">
            Order {order._id} is paid. Total: {formatCents(order.totalCents)}.
          </p>
          <p><Link to="/orders" className="btn btn-primary">View your orders</Link> <Link to="/" className="btn">Keep shopping</Link></p>
        </>
      )}

      {phase === "failed" && (
        <>
          <h1 id="success-title">Payment didn’t go through</h1>
          <p className="notice notice-error" role="alert">
            Your card was not charged and your cart is unchanged. Try again or use another card.
          </p>
          <p><Link to="/checkout" className="btn btn-primary">Try again</Link> <Link to="/cart" className="btn">Back to cart</Link></p>
        </>
      )}

      {phase === "timeout" && (
        <>
          <h1 id="success-title">Still confirming</h1>
          <p className="notice" role="status">
            We haven’t received confirmation yet. Check your orders in a minute for the final status.
          </p>
          <p><Link to="/orders" className="btn btn-primary">View your orders</Link></p>
        </>
      )}

      {(phase === "missing" || phase === "error") && (
        <>
          <h1 id="success-title">Order not found</h1>
          <p className="notice notice-error" role="alert">{state.error || "No order was specified."}</p>
          <p><Link to="/orders" className="btn">View your orders</Link></p>
        </>
      )}
    </section>
  );
}
