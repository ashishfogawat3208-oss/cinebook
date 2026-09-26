import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("access_token");

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }

          originalRequest.headers.Authorization = `Bearer ${token}`;

          api(originalRequest)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/token/refresh/`,
        {
          refresh: refreshToken,
        },
      );

      const newAccessToken = response.data.access;

      localStorage.setItem("access_token", newAccessToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      onRefreshed(newAccessToken);

      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;