import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import Spinner from "../components/Spinner.jsx";

const LIMIT = 12;

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [input, setInput] = useState(q);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", items: [], total: 0, error: null });

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) setParams(input ? { q: input } : {});
    }, 350);
    return () => clearTimeout(t);
  }, [input, q, setParams]);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, status: "loading", error: null }));
    (async () => {
      try {
        const data = await listProducts({ q, page, limit: LIMIT });
        if (active) setState({ status: "ready", items: data.items, total: data.total, error: null });
      } catch (err) {
        if (active) setState({ status: "error", items: [], total: 0, error: err.message });
      }
    })();
    return () => { active = false; };
  }, [q, page, reloadKey]);

  const pages = Math.max(1, Math.ceil(state.total / LIMIT));
  const goTo = (p) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  };

  return (
    <section aria-labelledby="shop-title">
      <div className="page-head">
        <h1 id="shop-title">Shop</h1>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="search">
          <label htmlFor="q" className="sr-only">Search products</label>
          <input id="q" type="search" placeholder="Search products" value={input} onChange={(e) => setInput(e.target.value)} />
        </form>
      </div>

      {state.status === "loading" && <Spinner label="Loading products" />}

      {state.status === "error" && (
        <div className="notice notice-error" role="alert">
          <p>{state.error}</p>
          <button type="button" className="btn" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </div>
      )}

      {state.status === "ready" && state.items.length === 0 && (
        <div className="empty">
          <p>{q ? `No products match “${q}”.` : "No products are available yet."}</p>
          {q && <button type="button" className="btn" onClick={() => { setInput(""); setParams({}); }}>Clear search</button>}
        </div>
      )}

      {state.status === "ready" && state.items.length > 0 && (
        <>
          <ul className="grid">
            {state.items.map((p) => <li key={p._id}><ProductCard product={p} /></li>)}
          </ul>
          <nav className="pager" aria-label="Pagination">
            <button type="button" className="btn" disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" className="btn" disabled={page >= pages} onClick={() => goTo(page + 1)}>Next</button>
          </nav>
        </>
      )}
    </section>
  );
}
