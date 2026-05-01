import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

/** When GET /products/categories is missing (older API) or fails, derive names from catalog. */
async function inferCategoriesFromProducts() {
  const catSet = new Set();
  let skip = 0;
  const limit = 100;

  for (;;) {
    const res = await api.get("/products", { params: { limit, skip } });
    const data = res.data;
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : [];

    for (const p of items) {
      const c = typeof p?.category === "string" ? p.category.trim() : "";
      if (c) catSet.add(c);
    }

    if (Array.isArray(data)) {
      break;
    }

    const total = Number(data?.total) ?? 0;
    skip += limit;
    if (items.length < limit || skip >= total) {
      break;
    }
  }

  return [...catSet].sort((a, b) => a.localeCompare(b));
}

export default function Sidebar({ onNavigate }) {
  const { user, status } = useAuth();
  const [categories, setCategories] = useState([]);
  const [catStatus, setCatStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/products/categories");
        if (cancelled) return;
        const fromApi = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) {
          setCategories(fromApi);
          setCatStatus("success");
        }
      } catch (_e) {
        if (cancelled) return;
        try {
          const inferred = await inferCategoriesFromProducts();
          if (!cancelled) {
            setCategories(inferred);
            setCatStatus("success");
          }
        } catch {
          if (!cancelled) setCatStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav className="sidebarNav" aria-label="Shop navigation">
      <div className="sidebarSectionTitle">Shop</div>
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
        onClick={() => onNavigate?.()}
      >
        All products
      </NavLink>

      <div className="sidebarSectionTitle">Categories</div>
      {catStatus === "loading" ? (
        <div className="muted small sidebarPad">Loading…</div>
      ) : null}
      {catStatus === "error" ? (
        <div className="muted small sidebarPad">Could not load categories.</div>
      ) : null}
      {catStatus === "success" && categories.length === 0 ? (
        <div className="muted small sidebarPad">No categories yet.</div>
      ) : null}
      <ul className="sidebarList">
        {categories.map((c) => (
          <li key={c}>
            <NavLink
              to={{ pathname: "/", search: `?category=${encodeURIComponent(c)}` }}
              className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
              onClick={() => onNavigate?.()}
            >
              {c}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebarSectionTitle">Deals</div>
      <p className="muted small sidebarPad">
        Open a product to create or join a group deal, then checkout when it completes.
      </p>

      {status === "authed" ? (
        <>
          <div className="sidebarSectionTitle">Your account</div>
          <NavLink
            to="/account"
            className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
            onClick={() => onNavigate?.()}
          >
            Account
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
            onClick={() => onNavigate?.()}
          >
            My orders
          </NavLink>
          {user?.role === "vendor" || user?.role === "admin" ? (
            <NavLink
              to="/vendor/products"
              className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
              onClick={() => onNavigate?.()}
            >
              Seller dashboard
            </NavLink>
          ) : null}
          {user?.role === "admin" ? (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
              onClick={() => onNavigate?.()}
            >
              Admin console
            </NavLink>
          ) : null}
        </>
      ) : null}
    </nav>
  );
}
