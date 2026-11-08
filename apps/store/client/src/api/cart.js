import { request } from "./http.js";

export const getCart = () => request("/cart");
export const putItem = (productId, qty) => request("/cart/items", { method: "PUT", body: { productId, qty } });
export const clearCart = () => request("/cart", { method: "DELETE" });
