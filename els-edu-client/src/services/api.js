// services/api.js
import axios from "axios";

// Fallback to local Strapi if env var is missing
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // Optional: Add ngrok header if needed for tunneling
    "ngrok-skip-browser-warning": "true",
  },
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use((config) => {
  // Try getting token from common storage keys
  const token = 
    localStorage.getItem("jwt") || 
    localStorage.getItem("token") ||
    JSON.parse(localStorage.getItem("auth") || "{}")?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Optional global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You could handle 401 redirects here
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
