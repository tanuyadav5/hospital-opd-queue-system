import { createContext, useContext, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [role, setRole] = useState(localStorage.getItem("adminRole"));

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminRole", data.role);
    setToken(data.token);
    setRole(data.role);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: Boolean(token), role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
