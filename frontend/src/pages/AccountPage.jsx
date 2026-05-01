import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [deals, setDeals] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setStatus("loading");
        setError("");
        const [meRes, dealsRes] = await Promise.all([
          api.get("/customer/me"),
          api.get("/customer/deals")
        ]);
        if (!cancelled) {
          setProfile(meRes.data);
          setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
          setStatus("success");
        }
      } catch (_e) {
        if (!cancelled) {
          setStatus("error");
          setError("Could not load your account.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page">
      <h1 className="pageTitle">Your account</h1>
      <p className="pageSubtitle">
        Profile, orders, and group-deal activity. Customers shop here; vendors also use Seller tools from the nav.
      </p>

      {status === "loading" ? (
        <div className="card">
          <div className="muted">Loading…</div>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="card">
          <div className="errorText">{error}</div>
        </div>
      ) : null}

      {status === "success" && profile ? (
        <div className="stack">
          <div className="card">
            <div className="cardTitle">Profile</div>
            <div className="accountRow">
              <span className="muted">Name</span>
              <span>{profile.name || "—"}</span>
            </div>
            <div className="accountRow">
              <span className="muted">Email</span>
              <span>{profile.email}</span>
            </div>
            <div className="accountRow">
              <span className="muted">Role</span>
              <span className="pill">{profile.role}</span>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Shopping</div>
            <p className="muted" style={{ marginBottom: 12 }}>
              Browse the store, join group deals on product pages, then pay with a mock checkout.
            </p>
            <div className="dealRow">
              <Link className="btn btnPrimary" to="/">
                Continue shopping
              </Link>
              <Link className="btn" to="/orders">
                My orders
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Your group deals</div>
            <p className="muted" style={{ marginBottom: 12 }}>
              Deals you created or joined (read-only summary).
            </p>
            {deals.length ? (
              <div className="stack">
                {deals.slice(0, 20).map((d) => (
                  <div key={d._id} className="card" style={{ padding: 12 }}>
                    <div className="cardRow">
                      <div>
                        <div className="cardTitle">{d.productId?.name || "Deal"}</div>
                        <div className="muted small">
                          Status: <span className="pill">{d.status}</span> · Joined{" "}
                          {d.joinedUsers?.length ?? 0}/{d.requiredUsers}
                        </div>
                      </div>
                      {d.productId?._id ? (
                        <Link className="btn" to={`/product/${d.productId._id}`}>
                          Product
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">No deals yet.</div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
