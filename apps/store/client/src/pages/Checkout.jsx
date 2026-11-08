import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createSession } from "../api/checkout.js";
import { useCart } from "../context/CartContext.jsx";
import StripePaymentForm from "../components/StripePaymentForm.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatCents } from "../utils/format.js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function Checkout() {
  const { cart, status: cartStatus } = useCart();
  const [state, setState] = useState({ status: "loading", clientSecret: null, orderId: null, error: null, stock: null });
  const started = useRef(false);

  // Create exactly one PaymentIntent per visit (guard against StrictMode's double effect).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const { clientSecret, orderId } = await createSession();
        setState({ status: "ready", clientSecret, orderId, error: null, stock: null });
      } catch (err) {
        setState({
          status: err.status === 409 ? "stock" : "error",
          clientSecret: null,
          orderId: null,
          error: err.message,
          stock: err.details?.items ?? err.details?.details ?? null
        });
      }
    })();
  }, []);

  if (!stripePromise) {
    return (
      <div className="notice notice-error" role="alert">
        <p>Payments aren’t configured. Set VITE_STRIPE_PUBLISHABLE_KEY and restart the app.</p>
      </div>
    );
  }
  if (state.status === "loading") return <Spinner label="Preparing secure checkout" />;

  if (state.status === "stock") {
    return (
      <section aria-labelledby="stock-title">
        <h1 id="stock-title">Some items are no longer available</h1>
        <div className="notice notice-error" role="alert">
          <p>{state.error}</p>
          {Array.isArray(state.stock) && state.stock.length > 0 && (
            <ul>
              {state.stock.map((it, i) => (
                <li key={it.productId ?? it.product ?? i}>
                  {it.name ?? it.productId ?? it.product}
                  {typeof it.available === "number" ? ` — ${it.available} available` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link to="/cart" className="btn btn-primary">Back to your cart</Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <div className="notice notice-error" role="alert">
        <p>{state.error}</p>
        <Link to="/cart" className="btn">Back to your cart</Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="checkout-title" className="checkout">
      <h1 id="checkout-title">Checkout</h1>
      <p className="summary-row">
        <span>Order total</span>
        <strong>{cartStatus === "ready" ? formatCents(cart.subtotal) : "—"}</strong>
      </p>
      <Elements stripe={stripePromise} options={{ clientSecret: state.clientSecret }}>
        <StripePaymentForm orderId={state.orderId} totalLabel={cartStatus === "ready" ? formatCents(cart.subtotal) : "now"} />
      </Elements>
      <p><Link to="/cart">← Back to cart</Link></p>
    </section>
  );
}
