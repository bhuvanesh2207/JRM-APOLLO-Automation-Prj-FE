import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/",
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise = null;

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest.url?.includes("/api/admin/login/") ||
      originalRequest.url?.includes("/api/admin/token/refresh/"); // ✅ fixed

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axiosInstance
          .post("/api/admin/token/refresh/") // ✅ fixed
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch (err) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;