const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check that the API is running and try again.", { code: "NETWORK_ERROR" });
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(err?.message || `Request failed (${res.status}).`, {
      status: res.status,
      code: err?.code || "HTTP_ERROR",
    });
  }
  return data;
}

function toQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const tasksApi = {
  list: (params = {}) => request(`/tasks${toQuery(params)}`),
  get: (id) => request(`/tasks/${id}`),
  create: (data) => request("/tasks", { method: "POST", body: data }),
  update: (id, patch) => request(`/tasks/${id}`, { method: "PATCH", body: patch }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
