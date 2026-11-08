import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { setUnauthorizedHandler, tokenStore } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" only while a stored token is being verified.
  const [status, setStatus] = useState(() => (tokenStore.get() ? "loading" : "ready"));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Any 401 on an authenticated request logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the session on load.
  useEffect(() => {
    if (!tokenStore.get()) {
      setStatus("ready");
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const data = await authApi.me();
        if (active) setUser(data.user);
      } catch (err) {
        if (active && (err.status === 401 || err.status === 403)) tokenStore.clear();
      } finally {
        if (active) setStatus("ready");
      }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, status, isLoading: status === "loading", login, register, logout }),
    [user, status, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
