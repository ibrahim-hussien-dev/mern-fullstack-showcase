import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "./Toast.jsx";
import { formatCents } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addItem, pendingId } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const soldOut = product.stock <= 0;
  const busy = pendingId === product._id;

  const onAdd = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    const res = await addItem(product._id);
    toast(res.ok ? `${product.name} added to your cart` : res.error, res.ok ? "ok" : "error");
  };

  return (
    <article className="product">
      <Link to={`/products/${product._id}`} className="product-media" aria-label={`View ${product.name}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="no-image">No image</span>
        )}
        {soldOut && <span className="badge badge-out">Out of stock</span>}
      </Link>
      <div className="product-body">
        <h3 className="product-name"><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
        <p className="price">{formatCents(product.priceCents)}</p>
        <button type="button" className="btn btn-primary" onClick={onAdd} disabled={soldOut || busy}>
          {soldOut ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
