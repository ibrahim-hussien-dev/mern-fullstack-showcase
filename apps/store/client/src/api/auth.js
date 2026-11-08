import { request } from "./http.js";

export const register = (payload) => request("/auth/register", { method: "POST", body: payload, auth: false });
export const login = (payload) => request("/auth/login", { method: "POST", body: payload, auth: false });
export const me = () => request("/auth/me");
