import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CustomerPage from "./pages/CustomerPage.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DisplayBoard from "./pages/DisplayBoard.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";

export default function App() {
  const { isLoggedIn, role, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // The TV board has no header or login: open /display
  if (pathname === "/display") return <DisplayBoard />;

  return (
    <>
      <header>
        <h1>Queue Management System</h1>
        <nav>
          <Link to="/">Get token</Link>
          {isLoggedIn ? (
            <>
              <Link to="/admin">Dashboard</Link>
              {role === "admin" && <Link to="/admin/analytics">Analytics</Link>}
              <button className="small" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <Link to="/admin/login">Staff login</Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}
