const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

/** Display-only formatting of a value the server returned in cents. */
export const formatCents = (cents) => money.format((Number(cents) || 0) / 100);

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
