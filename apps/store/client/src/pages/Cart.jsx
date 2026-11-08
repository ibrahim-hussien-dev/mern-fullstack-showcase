import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart, productIdOf } from "../context/CartContext.jsx";
import CartItem from "../components/CartItem.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatCents } from "../utils/format.js";

export default function Cart() {
  const { cart, status, error, pendingId, refresh, setQty, removeItem } = useCart();
  const [actionError, setActionError] = useState(null);

  const run = async (promise) => {
    setActionError(null);
    const res = await promise;
    if (!res.ok) setActionError(res.error);
  };

  return (
    <section aria-labelledby="cart-title">
      <h1 id="cart-title">Your cart</h1>

      {(status === "loading" || status === "idle") && <Spinner label="Loading your cart" />}

      {status === "error" && (
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={refresh}>Try again</button>
        </div>
      )}

      {status === "ready" && cart.items.length === 0 && (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">Browse products</Link>
        </div>
      )}

      {status === "ready" && cart.items.length > 0 && (
        <div className="cart-layout">
          {actionError && <p className="inline-error" role="alert">{actionError}</p>}
          <ul className="cart-list">
            {cart.items.map((line) => {
              const pid = productIdOf(line);
              return (
                <CartItem
                  key={pid}
                  line={line}
                  busy={pendingId === pid}
                  onQty={(qty) => run(setQty(pid, qty))}
                  onRemove={() => run(removeItem(pid))}
                />
              );
            })}
          </ul>
          <aside className="summary" aria-label="Order summary">
            <p className="summary-row"><span>Subtotal</span><strong>{formatCents(cart.subtotal)}</strong></p>
            <p className="muted">Final prices are confirmed by the server at checkout.</p>
            <Link to="/checkout" className="btn btn-primary btn-block">Go to checkout</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
