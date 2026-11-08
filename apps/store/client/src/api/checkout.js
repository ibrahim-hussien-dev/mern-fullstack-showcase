import { request } from "./http.js";

/** Returns { clientSecret, orderId }. */
export const createSession = () => request("/checkout/session", { method: "POST" });
