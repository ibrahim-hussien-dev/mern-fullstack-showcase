/** Prices ALWAYS come from the database documents – never from the client. */

export function subtotalCents(items) {
  return items.reduce((sum, i) => sum + i.product.priceCents * i.qty, 0);
}

/** Turns populated cart items into order lines (name/price snapshot) + total. */
export function buildOrderLines(cartItems) {
  const lines = cartItems
    .filter((i) => i.product)
    .map((i) => ({
      product: i.product._id,
      name: i.product.name,
      priceCents: i.product.priceCents,
      qty: i.qty,
    }));
  const totalCents = lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  return { lines, totalCents };
}
