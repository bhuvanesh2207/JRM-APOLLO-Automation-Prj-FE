import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // send HttpOnly cookies
});

let isRefreshing = false;
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // If refresh already in progress, wait for it
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axiosInstance
          .post("/api/admin/refresh/")
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
