import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

const PAGE_LIMIT = 25;

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ items: [], total: 0, skip: 0 });
  const [products, setProducts] = useState({ items: [], total: 0, skip: 0 });
  const [orders, setOrders] = useState({ items: [], total: 0, skip: 0 });
  const [deals, setDeals] = useState({ items: [], total: 0, skip: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    const res = await api.get("/admin/stats");
    setStats(res.data);
  }, []);

  const loadUsers = useCallback(async (skip = 0) => {
    const res = await api.get("/admin/users", { params: { limit: PAGE_LIMIT, skip } });
    setUsers({ ...res.data, skip });
  }, []);

  const loadProducts = useCallback(async (skip = 0) => {
    const res = await api.get("/admin/products", { params: { limit: PAGE_LIMIT, skip } });
    setProducts({ ...res.data, skip });
  }, []);

  const loadOrders = useCallback(async (skip = 0) => {
    const res = await api.get("/admin/orders", { params: { limit: PAGE_LIMIT, skip } });
    setOrders({ ...res.data, skip });
  }, []);

  const loadDeals = useCallback(async (skip = 0) => {
    const res = await api.get("/admin/deals", { params: { limit: PAGE_LIMIT, skip } });
    setDeals({ ...res.data, skip });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError("");
        if (tab === "overview") {
          await loadStats();
        } else {
          await loadStats();
          if (cancelled) return;
          if (tab === "users") await loadUsers(0);
          if (tab === "products") await loadProducts(0);
          if (tab === "orders") await loadOrders(0);
          if (tab === "deals") await loadDeals(0);
        }
      } catch (_e) {
        if (!cancelled) setError("Failed to load admin data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, loadStats, loadUsers, loadProducts, loadOrders, loadDeals]);

  async function changeRole(userId, role) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      await loadUsers(users.skip);
    } catch (_e) {
      setError("Could not update role.");
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      await loadProducts(products.skip);
      await loadStats();
    } catch (_e) {
      setError("Could not delete product.");
    }
  }

  async function setOrderStatus(orderId, status) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      await loadOrders(orders.skip);
    } catch (_e) {
      setError("Could not update order.");
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users & roles" },
    { id: "products", label: "Catalog" },
    { id: "orders", label: "Orders" },
    { id: "deals", label: "Group deals" }
  ];

  function Pager({ data, onPrev, onNext }) {
    const { total, skip, limit: lim } = data;
    const limit = lim || PAGE_LIMIT;
    const start = total === 0 ? 0 : skip + 1;
    const end = Math.min(skip + (limit || PAGE_LIMIT), total);
    return (
      <div className="pager">
        <span className="muted">
          {start}–{end} of {total}
        </span>
        <button
          type="button"
          className="btn"
          disabled={skip <= 0}
          onClick={() => onPrev(Math.max(0, skip - PAGE_LIMIT))}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn"
          disabled={skip + PAGE_LIMIT >= total}
          onClick={() => onNext(skip + PAGE_LIMIT)}
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <section className="page adminPage">
      <h1 className="pageTitle">Admin console</h1>
      <p className="pageSubtitle">
        Manage users, catalog, fulfillment, and monitor group deals. Same scope as a marketplace operator.
      </p>

      <div className="adminTabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "adminTab active" : "adminTab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <div className="errorText" style={{ marginBottom: 12 }}>{error}</div> : null}

      {tab === "overview" && (
        <div className="adminGrid">
          {loading && !stats ? <div className="muted">Loading…</div> : null}
          {stats ? (
            <>
              <div className="card adminStat">
                <div className="muted">Users</div>
                <div className="adminStatNum">{stats.users}</div>
              </div>
              <div className="card adminStat">
                <div className="muted">Products</div>
                <div className="adminStatNum">{stats.products}</div>
              </div>
              <div className="card adminStat">
                <div className="muted">Orders</div>
                <div className="adminStatNum">{stats.orders}</div>
              </div>
              <div className="card adminStat">
                <div className="muted">Deals</div>
                <div className="adminStatNum">{stats.deals}</div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {tab === "users" && (
        <div className="card adminTableCard">
          <Pager
            data={{ ...users, limit: PAGE_LIMIT }}
            onPrev={loadUsers}
            onNext={loadUsers}
          />
          <table className="adminTable">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.items?.map((u) => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>{u.name || "—"}</td>
                  <td>
                    <select
                      className="select inlineSelect"
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                    >
                      <option value="customer">customer</option>
                      <option value="vendor">vendor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="muted small">{u._id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "products" && (
        <div className="card adminTableCard">
          <Pager
            data={{ ...products, limit: PAGE_LIMIT }}
            onPrev={loadProducts}
            onNext={loadProducts}
          />
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Vendor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.items?.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/product/${p._id}`}>{p.name}</Link>
                  </td>
                  <td>${Number(p.price ?? 0).toFixed(2)}</td>
                  <td className="muted small">
                    {p.vendorId?.email || p.vendorId?._id || "—"}
                  </td>
                  <td>
                    <button type="button" className="btn dangerBtn" onClick={() => removeProduct(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <div className="card adminTableCard">
          <Pager
            data={{ ...orders, limit: PAGE_LIMIT }}
            onPrev={loadOrders}
            onNext={loadOrders}
          />
          <table className="adminTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.items?.map((o) => (
                <tr key={o._id}>
                  <td>{o.productId?.name || "—"}</td>
                  <td className="muted small">{o.userId}</td>
                  <td>${Number(o.pricePaid ?? 0).toFixed(2)}</td>
                  <td>
                    <select
                      className="select inlineSelect"
                      value={o.status}
                      onChange={(e) => setOrderStatus(o._id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "deals" && (
        <div className="card adminTableCard">
          <Pager
            data={{ ...deals, limit: PAGE_LIMIT }}
            onPrev={loadDeals}
            onNext={loadDeals}
          />
          <table className="adminTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Required</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {deals.items?.map((d) => (
                <tr key={d._id}>
                  <td>{d.productId?.name || "—"}</td>
                  <td>
                    <span className="pill">{d.status}</span>
                  </td>
                  <td>{d.joinedUsers?.length ?? 0}</td>
                  <td>{d.requiredUsers}</td>
                  <td className="muted small">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
