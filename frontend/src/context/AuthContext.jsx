import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | guest

  async function refresh() {
    try {
      setStatus("loading");
      const res = await api.get("/auth/me");
      setUser(res.data);
      setStatus("authed");
    } catch (_err) {
      setUser(null);
      setStatus("guest");
    }
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data);
    setStatus("authed");
    return res.data;
  }

  async function register({ name, email, password, role }) {
    const res = await api.post("/auth/register", { name, email, password, role });
    setUser(res.data);
    setStatus("authed");
    return res.data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, status, refresh, login, register, logout }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

