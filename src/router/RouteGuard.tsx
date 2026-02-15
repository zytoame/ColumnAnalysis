import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

// 白名单：普通用户只能访问报告页面
const CUSTOMER_ONLY_PATHS = new Set(["/query-reports"]);

// 页面级权限管理
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") {
    return <div style={{ padding: 16 }}>加载中...</div>;
  }

  // 未登录跳转登录页
  if (auth.status === "unauthenticated") {
    const baseUrl = String(import.meta.env.BASE_URL || "/").replace(/\/+$/g, "");
    const raw = `${location.pathname}${location.search || ""}`;
    const normalized = baseUrl && raw.startsWith(baseUrl + "/") ? raw.slice(baseUrl.length) : raw;
    const redirect = encodeURIComponent(normalized);
    return <Navigate to={`/wecom-login?redirect=${redirect}`} replace />;
  }

  // 普通用户只能进报告查询下载页面
  if (auth.role === "CUSTOMER") {
    if (!CUSTOMER_ONLY_PATHS.has(location.pathname)) {
      return <Navigate to="/query-reports" replace />;
    }
  }

  return <>{children}</>;
}
