import axios from "axios";

import { clearAccessToken, getAccessToken, setAccessToken } from "@/auth/token";

// const baseURL = (import.meta as any)?.env?.VITE_API_BASE_URL || "/api";
const baseURL = import.meta.env.VITE_API_BASE_URL;
const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
});

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = http
    .post("/user/refresh")
    .then((res) => {
      const token = (res as any)?.data?.data?.token;
      if (!token) {
        return null;
      }
      setAccessToken(token);
      return token;
    })
    .catch(() => null)
    .finally(() => {
      refreshingPromise = null;
    });

  return refreshingPromise;
}

http.interceptors.request.use(
  (config) => {

    // access token 仅存内存，避免 XSS 直接读 localStorage
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error);
  }
);
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const originalRequest = error?.config;
      const isRefreshRequest = String(originalRequest?.url || "").includes("/user/refresh");

      try {
        // 非 refresh 请求：先尝试静默刷新一次，再重放原请求
        if (!isRefreshRequest && originalRequest && !originalRequest.__retryAfterRefresh) {
          originalRequest.__retryAfterRefresh = true;
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = newToken.startsWith("Bearer ")
              ? newToken
              : `Bearer ${newToken}`;
            return http(originalRequest);
          }
        }

        // refresh 失败或已经重试过：清理内存 token，跳登录
        clearAccessToken();

        const baseUrl = String(import.meta.env.BASE_URL || "/").replace(/\/+$/g, "");
        const loginPath = `${baseUrl}/wecom-login`;
        const callbackPath = `${baseUrl}/callback`;

        // 避免在登录页/回调页触发 401 时自我重定向导致无限跳转
        if (window.location.pathname === loginPath || window.location.pathname === callbackPath) {
          return Promise.reject(error);
        }

        const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search || ""}`);
        window.location.replace(`${window.location.origin}${baseUrl}/wecom-login?redirect=${redirect}`);
      } catch (e) {
        // ignore
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default http;
