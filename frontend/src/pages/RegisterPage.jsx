import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setStatus("loading");
      setErrorMsg("");
      await register({ name, email, password, role });
      navigate("/", { replace: true });
    } catch (_err) {
      setStatus("idle");
      setErrorMsg("Could not create account.");
    }
  }

  return (
    <section className="page authPage">
      <div className="authCard">
        <h1 className="pageTitle">Create account</h1>
        <p className="pageSubtitle">Choose customer or vendor.</p>

        <form className="form" onSubmit={onSubmit}>
          <label className="dealLabel">
            Name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="dealLabel">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="dealLabel">
            Password (min 6)
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="dealLabel">
            Account type
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </label>

          <button className="btn btnPrimary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Creating…" : "Create account"}
          </button>

          {errorMsg ? <div className="errorText">{errorMsg}</div> : null}
        </form>

        <div className="muted" style={{ marginTop: 12 }}>
          Already have an account? <Link className="link" to="/login">Sign in</Link>
        </div>
      </div>
    </section>
  );
}

