import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../api/products.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatCents } from "../utils/format.js";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem, pendingId } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({ status: "loading", product: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", product: null, error: null });
    (async () => {
      try {
        const product = await getProduct(id);
        if (active) setState({ status: "ready", product, error: null });
      } catch (err) {
        if (active) setState({ status: "error", product: null, error: err.status === 404 ? "This product doesn’t exist." : err.message });
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (state.status === "loading") return <Spinner label="Loading product" />;
  if (state.status === "error") {
    return (
      <div className="notice notice-error" role="alert">
        <p>{state.error}</p>
        <Link to="/" className="btn">Back to shop</Link>
      </div>
    );
  }

  const p = state.product;
  const soldOut = p.stock <= 0;

  const onAdd = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const res = await addItem(p._id);
    toast(res.ok ? `${p.name} added to your cart` : res.error, res.ok ? "ok" : "error");
  };

  return (
    <article className="detail">
      <div className="detail-media">
        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <span className="no-image">No image</span>}
      </div>
      <div className="detail-body">
        <p><Link to="/">← Back to shop</Link></p>
        <h1>{p.name}</h1>
        <p className="price price-lg">{formatCents(p.priceCents)}</p>
        <p>{p.description}</p>
        <p>
          {soldOut ? <span className="badge badge-out">Out of stock</span> : <span className="muted">{p.stock} in stock</span>}
        </p>
        <button type="button" className="btn btn-primary" onClick={onAdd} disabled={soldOut || pendingId === p._id}>
          {soldOut ? "Out of stock" : pendingId === p._id ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
