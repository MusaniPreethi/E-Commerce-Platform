import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

const PAGE_LIMIT = 30;

export default function VendorProductsPage() {
  const [listStatus, setListStatus] = useState("idle");
  const [data, setData] = useState({ items: [], total: 0, skip: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: ""
  });
  const [createStatus, setCreateStatus] = useState("idle");
  const [createError, setCreateError] = useState("");

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveStatus, setSaveStatus] = useState("idle");

  const load = useCallback(async (skip = 0) => {
    try {
      setListStatus("loading");
      setErrorMsg("");
      const res = await api.get("/products/mine", {
        params: { limit: PAGE_LIMIT, skip }
      });
      setData({
        items: res.data.items ?? [],
        total: res.data.total ?? 0,
        skip: res.data.skip ?? skip
      });
      setListStatus("success");
    } catch (_err) {
      setListStatus("error");
      setErrorMsg("Could not load your products.");
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  async function createProduct(e) {
    e.preventDefault();
    try {
      setCreateStatus("loading");
      setCreateError("");
      await api.post("/products", {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        image: form.image,
        category: form.category
      });
      setForm({ name: "", price: "", description: "", image: "", category: "" });
      setCreateStatus("success");
      await load(data.skip);
    } catch (_err) {
      setCreateStatus("error");
      setCreateError("Could not create product.");
    }
  }

  function startEdit(p) {
    setEditing(p._id);
    setEditForm({
      name: p.name,
      price: String(p.price),
      description: p.description ?? "",
      image: p.image ?? "",
      category: p.category ?? ""
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      setSaveStatus("loading");
      await api.put(`/products/${editing}`, {
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description,
        image: editForm.image,
        category: editForm.category
      });
      setEditing(null);
      setSaveStatus("idle");
      await load(data.skip);
    } catch (_err) {
      setSaveStatus("error");
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Remove this listing?")) return;
    try {
      await api.delete(`/products/${id}`);
      await load(data.skip);
    } catch (_err) {
      setErrorMsg("Could not delete product.");
    }
  }

  const filtered =
    filter.trim() === ""
      ? data.items
      : data.items.filter((p) =>
          String(p.name).toLowerCase().includes(filter.trim().toLowerCase())
        );

  const start = data.total === 0 ? 0 : data.skip + 1;
  const end = Math.min(data.skip + PAGE_LIMIT, data.total);

  return (
    <section className="page">
      <h1 className="pageTitle">Seller dashboard</h1>
      <p className="pageSubtitle">
        List products, edit listings, and remove items you no longer sell. Only your inventory is shown here.
      </p>

      <div className="card">
        <div className="cardTitle">Add product</div>
        <form className="form" onSubmit={createProduct} style={{ marginTop: 12 }}>
          <label className="dealLabel">
            Name
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="dealLabel">
            Price
            <input
              className="input"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </label>
          <label className="dealLabel">
            Description
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="dealLabel">
            Image URL
            <input
              className="input"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            />
          </label>
          <label className="dealLabel">
            Category
            <input
              className="input"
              placeholder="e.g. Electronics"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </label>
          <button className="btn btnPrimary" type="submit" disabled={createStatus === "loading"}>
            {createStatus === "loading" ? "Creating…" : "Publish listing"}
          </button>
          {createStatus === "error" ? <div className="errorText">{createError}</div> : null}
        </form>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <div className="cardRow" style={{ marginBottom: 12 }}>
          <div className="cardTitle">Your listings</div>
          <div className="muted small">
            {start}–{end} of {data.total}
          </div>
        </div>
        <label className="dealLabel">
          Filter this page
          <input
            className="input"
            placeholder="Search by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>

        <div className="pager" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            disabled={data.skip <= 0}
            onClick={() => load(Math.max(0, data.skip - PAGE_LIMIT))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn"
            disabled={data.skip + PAGE_LIMIT >= data.total}
            onClick={() => load(data.skip + PAGE_LIMIT)}
          >
            Next
          </button>
        </div>

        {listStatus === "loading" ? <div className="muted">Loading…</div> : null}
        {listStatus === "error" ? <div className="errorText">{errorMsg}</div> : null}

        {listStatus === "success" ? (
          filtered.length ? (
            <div className="stack" style={{ marginTop: 12 }}>
              {filtered.map((p) => (
                <div key={p._id} className="card" style={{ padding: 12 }}>
                  {editing === p._id ? (
                    <div className="form">
                      <label className="dealLabel">
                        Name
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </label>
                      <label className="dealLabel">
                        Price
                        <input
                          className="input"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, price: e.target.value }))
                          }
                        />
                      </label>
                      <label className="dealLabel">
                        Description
                        <input
                          className="input"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, description: e.target.value }))
                          }
                        />
                      </label>
                      <label className="dealLabel">
                        Image URL
                        <input
                          className="input"
                          value={editForm.image}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, image: e.target.value }))
                          }
                        />
                      </label>
                      <label className="dealLabel">
                        Category
                        <input
                          className="input"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, category: e.target.value }))
                          }
                        />
                      </label>
                      <div className="dealRow">
                        <button
                          type="button"
                          className="btn btnPrimary"
                          disabled={saveStatus === "loading"}
                          onClick={saveEdit}
                        >
                          Save
                        </button>
                        <button type="button" className="btn" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                      {saveStatus === "error" ? (
                        <div className="errorText">Save failed.</div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="cardRow">
                      <div>
                        <div className="cardTitle">{p.name}</div>
                        <div className="muted">
                          {p.category ? <span className="pill">{p.category}</span> : null}{" "}
                          <span className="pill">${Number(p.price ?? 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="dealRow">
                        <Link className="btn" to={`/product/${p._id}`}>
                          View
                        </Link>
                        <button type="button" className="btn" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn dangerBtn"
                          onClick={() => removeProduct(p._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 12 }}>
              No products on this page.
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
