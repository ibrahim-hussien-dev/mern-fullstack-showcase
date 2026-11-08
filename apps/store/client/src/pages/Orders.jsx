import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../api/orders.js";
import Spinner from "../components/Spinner.jsx";
import { formatCents, formatDate } from "../utils/format.js";

const LABELS = { pending: "Pending", paid: "Paid", failed: "Failed" };

export default function Orders() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", orders: [], error: null });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", orders: [], error: null });
    (async () => {
      try {
        const orders = await listOrders();
        if (active) setState({ status: "ready", orders, error: null });
      } catch (err) {
        if (active) setState({ status: "error", orders: [], error: err.message });
      }
    })();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <section aria-labelledby="orders-title">
      <h1 id="orders-title">Your orders</h1>
      {state.status === "loading" && <Spinner label="Loading orders" />}
      {state.status === "error" && (
        <div className="notice notice-error" role="alert">
          <p>{state.error}</p>
          <button type="button" className="btn" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </div>
      )}
      {state.status === "ready" && state.orders.length === 0 && (
        <div className="empty">
          <p>You haven’t placed any orders yet.</p>
          <Link to="/" className="btn btn-primary">Browse products</Link>
        </div>
      )}
      {state.status === "ready" && state.orders.length > 0 && (
        <ul className="orders">
          {state.orders.map((o) => (
            <li key={o._id} className="order">
              <div className="order-head">
                <span className={`badge badge-${o.status}`}>{LABELS[o.status] ?? o.status}</span>
                <time dateTime={o.createdAt}>{formatDate(o.createdAt)}</time>
                <strong>{formatCents(o.totalCents)}</strong>
              </div>
              <ul className="order-items">
                {o.items.map((it, i) => (
                  <li key={`${it.product}-${i}`}>{it.qty} × {it.name} <span className="muted">({formatCents(it.priceCents)} each)</span></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
