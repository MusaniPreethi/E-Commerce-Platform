import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

export default function WishlistPage() {
  const [status, setStatus] = useState("loading");
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      try {
        setStatus("loading");
        setErrorMsg("");
        const res = await api.get("/customer/wishlist");
        if (!cancelled) {
          setItems(Array.isArray(res.data) ? res.data : []);
          setStatus("success");
        }
      } catch (_err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Failed to load wishlist.");
        }
      }
    }

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(productId) {
    try {
      setStatus("loading");
      await api.delete(`/customer/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => item._id !== productId));
      setStatus("success");
    } catch (_err) {
      setStatus("error");
      setErrorMsg("Could not remove item from wishlist.");
    }
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Wishlist</h1>
      <p className="pageSubtitle">Your saved products for later.</p>

      {status === "loading" ? (
        <div className="card">
          <div className="muted">Loading wishlist…</div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="card">
          <div className="errorText">{errorMsg}</div>
        </div>
      ) : null}

      {status === "success" && items.length ? (
        <div className="grid">
          {items.map((product) => (
            <article key={product._id} className="productCard">
              <Link className="productMedia" to={`/product/${product._id}`}>
                {product.image ? (
                  <img className="productImg" src={product.image} alt={product.name} />
                ) : (
                  <div className="productImgFallback">No image</div>
                )}
              </Link>

              <div className="productBody">
                {product.category ? (
                  <div className="productCategory">
                    <span className="pill">{product.category}</span>
                  </div>
                ) : null}
                <div className="productName" title={product.name}>
                  {product.name}
                </div>
                <div className="productMetaRow">
                  <div className="productPrice">
                    ${Number(product.price ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="productActions">
                <Link className="btn" to={`/product/${product._id}`}>
                  View Details
                </Link>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => handleRemove(product._id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {status === "success" && !items.length ? (
        <div className="card">
          <div className="muted">Your wishlist is empty.</div>
        </div>
      ) : null}
    </section>
  );
}
