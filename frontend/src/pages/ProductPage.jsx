import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600) % 24;
  const d = Math.floor(total / 86400);
  const pad = (n) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { status: authStatus, user } = useAuth();
  const isLoggedIn = authStatus === "authed" && user;
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [product, setProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Group deal UI state
  const [requiredUsers, setRequiredUsers] = useState(2);
  const [createStatus, setCreateStatus] = useState("idle"); // idle | loading | success | error
  const [createError, setCreateError] = useState("");
  const [activeDeal, setActiveDeal] = useState(null);

  const [dealLookupId, setDealLookupId] = useState("");
  const [dealStatus, setDealStatus] = useState("idle"); // idle | loading | success | error
  const [dealError, setDealError] = useState("");

  const [joinStatus, setJoinStatus] = useState("idle"); // idle | loading | success | error
  const [joinError, setJoinError] = useState("");

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState("idle");
  const [wishlistError, setWishlistError] = useState("");
  const [wishlistMessage, setWishlistMessage] = useState("");

  const expiresAtMs = useMemo(() => {
    if (!activeDeal?.expiresAt) return null;
    const t = new Date(activeDeal.expiresAt).getTime();
    return Number.isFinite(t) ? t : null;
  }, [activeDeal?.expiresAt]);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!expiresAtMs) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAtMs]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setErrorMsg("");
        const res = await api.get(`/products/${id}`);
        if (!cancelled) {
          setProduct(res.data ?? null);
          setStatus("success");
        }
      } catch (_err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Product not found or failed to load.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn || !product?._id) {
      setWishlisted(false);
      return;
    }

    let cancelled = false;
    async function loadWishlist() {
      try {
        const res = await api.get("/customer/wishlist");
        if (!cancelled) {
          const ids = Array.isArray(res.data) ? res.data.map((item) => item._id) : [];
          setWishlisted(ids.includes(product._id));
        }
      } catch (_err) {
        if (!cancelled) {
          setWishlistError("Could not load wishlist status.");
        }
      }
    }

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, product?._id]);

  function requireLogin() {
    navigate("/login", { state: { from: `/product/${id}` } });
  }

  async function handleCreateDeal() {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    try {
      setCreateStatus("loading");
      setCreateError("");
      const res = await api.post("/deals/create", {
        productId: id,
        requiredUsers
      });
      setActiveDeal(res.data);
      setDealLookupId(res.data?._id ?? "");
      setCreateStatus("success");
    } catch (_err) {
      setCreateStatus("error");
      setCreateError("Failed to create deal.");
    }
  }

  async function handleFetchDeal() {
    try {
      const dealId = dealLookupId.trim();
      if (!dealId) return;

      setDealStatus("loading");
      setDealError("");
      const res = await api.get(`/deals/${dealId}`);
      setActiveDeal(res.data);
      setDealStatus("success");
    } catch (_err) {
      setDealStatus("error");
      setDealError("Failed to fetch deal.");
    }
  }

  async function handleJoinDeal() {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    try {
      const dealId = (activeDeal?._id ?? dealLookupId).trim();
      if (!dealId) return;

      setJoinStatus("loading");
      setJoinError("");
      const res = await api.post(`/deals/join/${dealId}`, {});
      const updatedDeal = res.data;
      setActiveDeal(updatedDeal);
      setJoinStatus("success");

      if (updatedDeal?.status === "completed") {
        navigate("/payment", { state: { dealId } });
      }
    } catch (_err) {
      setJoinStatus("error");
      setJoinError("Failed to join deal.");
    }
  }

  async function handleToggleWishlist() {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    try {
      setWishlistStatus("loading");
      setWishlistError("");

      if (wishlisted) {
        await api.delete(`/customer/wishlist/${product._id}`);
        setWishlisted(false);
      } else {
        await api.post(`/customer/wishlist/${product._id}`);
        setWishlisted(true);
      }

      setWishlistStatus("success");
    } catch (_err) {
      setWishlistStatus("error");
      setWishlistError("Failed to update wishlist.");
    }
  }

  async function handleBuyNow() {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    try {
      // For "Buy Now" we create a 1-user deal, join it, then go to payment.
      const created = await api.post("/deals/create", { productId: id, requiredUsers: 1 });
      const dealId = created.data?._id;
      if (!dealId) throw new Error("Missing dealId");

      await api.post(`/deals/join/${dealId}`, {});
      navigate("/payment", { state: { dealId } });
    } catch (_err) {
      setJoinStatus("error");
      setJoinError("Buy Now failed. Could not start checkout.");
    }
  }

  const joinedCount = activeDeal?.joinedUsers?.length ?? 0;
  const requiredCount = activeDeal?.requiredUsers ?? 0;
  const remainingSlots = Math.max(0, Number(requiredCount) - Number(joinedCount));
  const countdown =
    expiresAtMs != null ? formatCountdown(Math.max(0, expiresAtMs - nowMs)) : null;

  return (
    <section className="page">
      <h1 className="pageTitle">Product</h1>
      <p className="pageSubtitle">
        Product ID: <span className="pill">{id}</span>
      </p>

      {status === "loading" ? (
        <div className="card">
          <div className="muted">Loading product…</div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="card">
          <div className="errorText">{errorMsg}</div>
        </div>
      ) : null}

      {status === "success" && product ? (
        <div className="card productDetail">
          <div className="detailMedia">
            {product.image ? (
              <img className="detailImg" src={product.image} alt={product.name} />
            ) : (
              <div className="detailImgFallback">No image</div>
            )}
          </div>

          <div className="detailBody">
            <div className="detailTitle">{product.name}</div>
            <div className="detailPrice">
              <span className="pill">
                ${Number(product.price ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="detailDesc">{product.description || "No description."}</p>

            <div className="detailActions">
              <button className="btn btnPrimary" type="button" onClick={handleBuyNow}>
                Buy Now
              </button>
              <button className="btn" type="button" onClick={handleToggleWishlist}>
                {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
              <button className="btn" type="button" onClick={handleJoinDeal}>
                Join Group Deal
              </button>
            </div>

            <div className="dealPanel">
              <div className="dealTitleRow">
                <div className="cardTitle">Group Deal</div>
                {activeDeal?._id ? (
                  <span className="pill">Deal: {activeDeal._id}</span>
                ) : null}
              </div>

              {!isLoggedIn ? (
                <p className="muted" style={{ marginBottom: 12 }}>
                  Sign in to create or join deals and to use Buy Now.
                </p>
              ) : null}

              <div className="dealRow">
                <label className="dealLabel">
                  Required users
                  <select
                    className="select"
                    value={requiredUsers}
                    onChange={(e) => setRequiredUsers(Number(e.target.value))}
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                    <option value={8}>8</option>
                  </select>
                </label>

                <button
                  className="btn btnPrimary"
                  type="button"
                  onClick={handleCreateDeal}
                  disabled={createStatus === "loading"}
                >
                  {createStatus === "loading" ? "Creating…" : "Create Deal"}
                </button>
              </div>

              {createStatus === "error" ? (
                <div className="errorText">{createError}</div>
              ) : null}
            {wishlistStatus === "error" ? (
              <div className="errorText">{wishlistError}</div>
            ) : null}
            {wishlistMessage ? (
              <div className="pill" style={{ marginTop: 8 }}>
                {wishlistMessage}
              </div>
            ) : null}
              <div className="dealRow">
                <label className="dealLabel grow">
                  Deal ID
                  <input
                    className="input"
                    placeholder="Paste deal id…"
                    value={dealLookupId}
                    onChange={(e) => setDealLookupId(e.target.value)}
                  />
                </label>
                <button
                  className="btn"
                  type="button"
                  onClick={handleFetchDeal}
                  disabled={!dealLookupId.trim() || dealStatus === "loading"}
                >
                  {dealStatus === "loading" ? "Fetching…" : "Fetch Deal"}
                </button>
              </div>

              {dealStatus === "error" ? (
                <div className="errorText">{dealError}</div>
              ) : null}

              {activeDeal ? (
                <div className="dealInfo">
                  <div className="dealStats">
                    <div>
                      <div className="muted">Status</div>
                      <div className="pill">{activeDeal.status}</div>
                    </div>
                    <div>
                      <div className="muted">Joined</div>
                      <div className="pill">
                        {joinedCount}/{requiredCount}
                      </div>
                    </div>
                    <div>
                      <div className="muted">Remaining</div>
                      <div className="pill">{remainingSlots}</div>
                    </div>
                    <div>
                      <div className="muted">Expires in</div>
                      <div className="pill">{countdown ?? "—"}</div>
                    </div>
                  </div>

                  <div className="dealRow">
                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={handleJoinDeal}
                      disabled={joinStatus === "loading" || activeDeal.status !== "open"}
                    >
                      {joinStatus === "loading" ? "Joining…" : "Join Deal"}
                    </button>
                  </div>

                  {joinStatus === "error" ? (
                    <div className="errorText">{joinError}</div>
                  ) : null}
                </div>
              ) : (
                <div className="muted">
                  Create a deal or paste a Deal ID to view/join.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

