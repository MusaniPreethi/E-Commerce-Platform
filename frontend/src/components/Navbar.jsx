import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onOpenSidebar }) {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    const s = sp.toString();
    navigate(s ? `/?${s}` : "/");
  }

  return (
    <header className="navbar">
      <div className="navbarInner">
        {onOpenSidebar ? (
          <button
            type="button"
            className="menuToggle"
            aria-label="Open menu"
            onClick={onOpenSidebar}
          >
            ☰
          </button>
        ) : null}
        <div className="brand">
          <NavLink to="/" className="brandLink">
            Shop<span className="brandDot">.</span>
          </NavLink>
        </div>

        <form className="searchBar" onSubmit={submitSearch}>
          <input
            className="searchInput"
            placeholder="Search products"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="searchBtn" type="submit">
            Search
          </button>
        </form>

        <nav className="navLinks">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
          >
            Home
          </NavLink>

          {status === "authed" ? (
            <>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  isActive ? "navLink active" : "navLink"
                }
              >
                Account
              </NavLink>
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  isActive ? "navLink active" : "navLink"
                }
              >
                Wishlist
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive ? "navLink active" : "navLink"
                }
              >
                My Orders
              </NavLink>

              {user?.role === "vendor" || user?.role === "admin" ? (
                <NavLink
                  to="/vendor/products"
                  className={({ isActive }) =>
                    isActive ? "navLink active" : "navLink"
                  }
                >
                  Seller
                </NavLink>
              ) : null}

              {user?.role === "admin" ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? "navLink active" : "navLink"
                  }
                >
                  Admin
                </NavLink>
              ) : null}

              <button
                className="navButton"
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
            >
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

