import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/auth.js", () => ({ me: vi.fn(), login: vi.fn(), register: vi.fn() }));

import * as authApi from "../api/auth.js";
import { tokenStore } from "../api/http.js";
import { AuthProvider, useAuth } from "../context/AuthContext.jsx";

let ctx;
function Probe() {
  ctx = useAuth();
  return <p data-testid="state">{ctx.isLoading ? "loading" : ctx.user ? ctx.user.name : "anon"}</p>;
}
const mount = () => render(<AuthProvider><Probe /></AuthProvider>);

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("restores the session from a stored token via /auth/me", async () => {
    tokenStore.set("tok");
    authApi.me.mockResolvedValue({ user: { _id: "u1", name: "Sam" } });
    mount();
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("Sam"));
  });

  it("drops an invalid stored token", async () => {
    tokenStore.set("bad");
    authApi.me.mockRejectedValue(Object.assign(new Error("nope"), { status: 401 }));
    mount();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("anon"));
    expect(tokenStore.get()).toBeNull();
  });

  it("login stores the token and logout clears it", async () => {
    authApi.login.mockResolvedValue({ token: "t1", user: { _id: "u1", name: "Sam" } });
    mount();
    await act(async () => { await ctx.login({ email: "a@b.co", password: "password1" }); });
    expect(tokenStore.get()).toBe("t1");
    expect(screen.getByTestId("state")).toHaveTextContent("Sam");
    act(() => ctx.logout());
    expect(tokenStore.get()).toBeNull();
    expect(screen.getByTestId("state")).toHaveTextContent("anon");
  });
});
