import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const userId = user?._id;
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [orders, setOrders] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDeleteOrder(orderId) {
    if (!orderId) return;
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (!confirmed) return;

    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((order) => order.id !== orderId && order._id !== orderId));
    } catch (err) {
      console.error("delete order failed", err);
      setErrorMsg("Unable to delete order. Please try again.");
      setStatus("error");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!userId) return;
        setStatus("loading");
        setErrorMsg("");
        const res = await api.get(`/orders/user/${userId}`);
        if (!cancelled) {
          setOrders(Array.isArray(res.data) ? res.data : []);
          setStatus("success");
        }
      } catch (_err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Failed to load orders.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section className="page">
      <h1 className="pageTitle">My Orders</h1>
      <p className="pageSubtitle">
        Account: <span className="pill">{user?.email ?? ""}</span>
      </p>

      {status === "loading" ? (
        <div className="card">
          <div className="muted">Loading orders…</div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="card">
          <div className="errorText">{errorMsg}</div>
        </div>
      ) : null}

      {status === "success" ? (
        orders.length ? (
          <div className="stack">
            {orders.map((o) => (
              <div key={o.id||o._id} className="card">
                <div className="cardRow">
                  <div>
                    <div className="cardTitle">
                      {o.productName || o.productId?.name || "Order"}
                    </div>
                    <div className="orderMeta">
                      <div className="orderMetaItem">
                        <span className="muted">Price</span>
                        <span className="pill">
                          ${Number(o.pricePaid ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="orderMetaItem">
                        <span className="muted">Status</span>
                        <span className={`statusBadge status-${o.status}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {o.productId?._id ? (
                    <Link className="btn" to={`/product/${o.productId._id}`}>
                      View Product
                    </Link>
                  ) : null}
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleDeleteOrder(o.id || o._id)}
                    style={{ marginLeft: 10 }}
                  >
                    Delete
                  </button>
                </div>
                <div className="muted" style={{ marginTop: 10 }}>
                  Address: {o.address}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="muted">No orders yet.</div>
          </div>
        )
      ) : null}
    </section>
  );
}

