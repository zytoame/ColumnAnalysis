import React from "react";
import { useAuth } from "@/auth/AuthProvider";

type Props = {
  allow: string[];
  children: React.ReactNode;
};

// 按钮级权限管理
export function RoleGuard({ allow, children }: Props) {
  const auth = useAuth();

  if (auth.status !== "authenticated") {
    return null;
  }

  if (!allow.includes(auth.role)) {
    return null;
  }

  return <>{children}</>;
}
