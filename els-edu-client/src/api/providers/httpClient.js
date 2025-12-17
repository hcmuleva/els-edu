// HTTP client configuration
import { fetchUtils } from "react-admin";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:1337/api";

// Custom HTTP client that adds JWT to all requests
export const httpClient = (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  if (token) {
    options.headers.set("Authorization", `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

export { apiUrl };
