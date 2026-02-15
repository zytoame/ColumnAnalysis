import React from "react";
import { useQuery } from "@tanstack/react-query";
import  http  from "@/lib/http";

// 认证状态
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// 认证状态
type AuthState = {
  status: AuthStatus;
  role: string;
  user: any;
  refresh: () => void;
};

// 认证上下文
const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const res = await http.get("/user/info");
      const payload = (res as any)?.data?.data;
      if (payload === undefined) {
        throw new Error("用户信息接口返回为空或格式不正确");
      }
      return payload;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const value = React.useMemo<AuthState>(() => {
    if (query.isLoading) {
      return {
        status: "loading",
        role: "",
        user: null,
        refresh: () => query.refetch(),
      };
    }

    // 未登录认证
    if (query.isError) {
      return {
        status: "unauthenticated",
        role: "",
        user: null,
        refresh: () => query.refetch(),
      };
    }

    const payload = query.data;
    const user = payload?.user ?? payload;
    const role = String(payload?.role ?? user?.role ?? "").trim();

    // 返回认证结构体
    return {
      status: "authenticated",
      role,
      user,
      refresh: () => query.refetch(),
    };
  }, [query]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("未获取到认证信息，请在AuthProvider内使用useAuth");
  }
  return ctx;
}
