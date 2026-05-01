import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireRole({ anyOf, children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="card">
        <div className="muted">Checking permissions…</div>
      </div>
    );
  }

  if (status === "guest") return <Navigate to="/login" replace />;

  const roles = Array.isArray(anyOf) ? anyOf : [anyOf];
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
}

