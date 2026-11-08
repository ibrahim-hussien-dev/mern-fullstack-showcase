import { request } from "./http.js";

export function listProducts({ q = "", page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return request(`/products?${params}`, { auth: false });
}

export const getProduct = (id) => request(`/products/${encodeURIComponent(id)}`, { auth: false });
