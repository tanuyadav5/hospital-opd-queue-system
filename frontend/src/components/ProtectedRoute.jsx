import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Not logged in -> login page. Wrong role -> back to the dashboard.
// Hiding a link is only for looks; the server still enforces roles.
export default function ProtectedRoute({ roles }) {
  const { isLoggedIn, role } = useAuth();
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/admin" replace />;
  return <Outlet />;
}
