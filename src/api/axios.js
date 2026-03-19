import axios from "axios";

const axiosInstance = axios.create({
  withCredentials: true, // sends HttpOnly cookies on every request
});

let isRefreshing = false;
let refreshPromise = null;

// ─── Request: attach CSRF token from cookie ───────────────────
axiosInstance.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];

  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

// ─── Response: auto-refresh on 401 ───────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never retry these endpoints — avoids infinite loops
    const isAuthEndpoint =
      originalRequest.url?.includes("/api/admin/refresh/") ||
      originalRequest.url?.includes("/api/admin/login/") ||
      originalRequest.url?.includes("/api/admin/forgot-password/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axiosInstance
          .post("/api/admin/refresh/")
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return axiosInstance(originalRequest); // retry original request
      } catch {
        // Refresh token is expired — kick back to login
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;