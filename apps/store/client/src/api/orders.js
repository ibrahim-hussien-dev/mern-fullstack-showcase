import { request } from "./http.js";

export const listOrders = () => request("/orders");
export const getOrder = (id) => request(`/orders/${encodeURIComponent(id)}`);
