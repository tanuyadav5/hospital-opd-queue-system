import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach the admin JWT (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorText = (err) => err.response?.data?.message || "Something went wrong";

export default api;
