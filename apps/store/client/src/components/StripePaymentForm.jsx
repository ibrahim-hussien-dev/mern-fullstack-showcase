import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function StripePaymentForm({ orderId, totalLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success?orderId=${encodeURIComponent(orderId)}`
      }
    });

    // confirmPayment only returns when something went wrong (otherwise it redirects).
    if (stripeError) {
      setError(stripeError.message || "Your payment could not be completed. Try another card.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="pay-form" aria-busy={submitting}>
      <PaymentElement />
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={!stripe || !elements || submitting}>
        {submitting ? "Processing…" : `Pay ${totalLabel}`}
      </button>
      {import.meta.env.DEV && (
        <p className="hint">
          Test mode: use card 4242 4242 4242 4242 with any future expiry date and any CVC.
        </p>
      )}
    </form>
  );
}
