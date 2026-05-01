import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setStatus("loading");
      setErrorMsg("");
      await login(email, password);
      navigate(from, { replace: true });
    } catch (_err) {
      setStatus("idle");
      setErrorMsg("Invalid credentials.");
    }
  }

  return (
    <section className="page authPage">
      <div className="authCard">
        <h1 className="pageTitle">Sign in</h1>
        <p className="pageSubtitle">Login as customer, vendor, or admin.</p>

        <form className="form" onSubmit={onSubmit}>
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
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button className="btn btnPrimary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>

          {errorMsg ? <div className="errorText">{errorMsg}</div> : null}
        </form>

        <div className="muted" style={{ marginTop: 12 }}>
          New here? <Link className="link" to="/register">Create an account</Link>
        </div>
      </div>
    </section>
  );
}

