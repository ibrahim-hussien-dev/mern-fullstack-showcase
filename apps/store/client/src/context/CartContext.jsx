import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as cartApi from "../api/cart.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);
const EMPTY = { items: [], subtotal: 0 };

const normalize = (data) => ({ items: data?.items ?? [], subtotal: data?.subtotal ?? 0 });
export const productIdOf = (line) => line?.product?._id ?? line?.product;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id ?? user?.id ?? null;

  const [cart, setCart] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const latest = useRef(0);

  // The cart lives on the server: load it whenever the signed-in user changes.
  const refresh = useCallback(async () => {
    const ticket = ++latest.current;
    if (!userId) {
      setCart(EMPTY);
      setStatus("idle");
      setError(null);
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const data = await cartApi.getCart();
      if (ticket !== latest.current) return;
      setCart(normalize(data));
      setStatus("ready");
    } catch (err) {
      if (ticket !== latest.current) return;
      setError(err.message);
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // qty 0 removes the line. The server's response is the source of truth.
  const setQty = useCallback(async (productId, qty) => {
    setPendingId(productId);
    try {
      setCart(normalize(await cartApi.putItem(productId, qty)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setPendingId(null);
    }
  }, []);

  const addItem = useCallback(
    (productId) => {
      const current = cart.items.find((l) => productIdOf(l) === productId)?.qty ?? 0;
      return setQty(productId, current + 1);
    },
    [cart.items, setQty]
  );

  const removeItem = useCallback((productId) => setQty(productId, 0), [setQty]);

  const clear = useCallback(async () => {
    try {
      await cartApi.clearCart();
      setCart(EMPTY);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const count = useMemo(() => cart.items.reduce((n, l) => n + l.qty, 0), [cart.items]);

  const value = useMemo(
    () => ({ cart, count, status, error, pendingId, refresh, addItem, setQty, removeItem, clear }),
    [cart, count, status, error, pendingId, refresh, addItem, setQty, removeItem, clear]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
