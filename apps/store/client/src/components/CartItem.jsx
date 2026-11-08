import { Link } from "react-router-dom";
import { formatCents } from "../utils/format.js";

export default function CartItem({ line, busy, onQty, onRemove }) {
  const { product, qty } = line;
  const atMax = typeof product.stock === "number" && qty >= product.stock;

  return (
    <li className="cart-line">
      <div className="cart-thumb">
        {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className="no-image">No image</span>}
      </div>
      <div className="cart-info">
        <Link to={`/products/${product._id}`} className="product-name">{product.name}</Link>
        <p className="muted">{formatCents(product.priceCents)} each</p>
        {typeof product.stock === "number" && product.stock < qty && (
          <p className="inline-error">Only {product.stock} left in stock.</p>
        )}
      </div>
      <div className="qty" role="group" aria-label={`Quantity for ${product.name}`}>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => onQty(qty - 1)} aria-label="Decrease quantity">−</button>
        <output aria-live="polite">{qty}</output>
        <button type="button" className="btn btn-ghost" disabled={busy || atMax} onClick={() => onQty(qty + 1)} aria-label="Increase quantity">+</button>
      </div>
      <p className="line-total">{formatCents(product.priceCents * qty)}</p>
      <button type="button" className="btn btn-link" disabled={busy} onClick={onRemove} aria-label={`Remove ${product.name}`}>Remove</button>
    </li>
  );
}
