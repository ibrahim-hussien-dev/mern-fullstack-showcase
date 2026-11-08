const BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";
const TOKEN_KEY = "store_token";

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  }
};

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "NETWORK");
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  if (!res.ok) {
    // An expired/invalid token on an authenticated call logs the user out.
    if (res.status === 401 && auth && token && onUnauthorized) onUnauthorized();
    throw new ApiError(
      data?.error?.message || `Request failed (${res.status})`,
      res.status,
      data?.error?.code,
      data?.error
    );
  }
  return data;
}
