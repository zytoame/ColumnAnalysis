// @ts-nocheck
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  unstable_HistoryRouter as BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { PageWrapper } from "./components/ui/page-wrapper";
import { routers } from "./configs/routers";
import { createBrowserHistory } from "history";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { RouteGuard } from "@/router/RouteGuard";
import WeComLogin from "./pages/wecom-login.jsx";
import WeComCallback from "./pages/callback.jsx";

// 创建历史记录
const history = createBrowserHistory();
window._WEAPPS_HISTORY = history;
// 创建查询客户端
const queryClient = new QueryClient();

function RootRedirect() {
  const auth = useAuth();
  if (auth.status === "loading") {
    return <div style={{ padding: 16 }}>加载中...</div>;
  }
  if (auth.status === "unauthenticated") {
    return <Navigate to="/wecom-login" replace />;
  }
  if (auth.role === "CUSTOMER") {
    return <Navigate to="/query-reports" replace />;
  }
  return (
    <Navigate
      to={`/${routers.find((item) => item.isHome)?.id || routers[0].id}`}
      replace
    />
  );
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter history={history} basename="/coaAdmin">
            <Routes>
              <Route path="/wecom-login" element={<WeComLogin />} />
              <Route path="/callback" element={<WeComCallback />} />
              <Route
                path="/"
                element={
                  <RouteGuard>
                    <RootRedirect />
                  </RouteGuard>
                }
              />
              {routers.map((item) => {
                return (
                  <Route
                    key={item.id}
                    path={`/${item.id}`}
                    element={
                      <RouteGuard>
                        <DashboardLayout>
                          <PageWrapper id={item.id} Page={item.component} />
                        </DashboardLayout>
                      </RouteGuard>
                    }
                  />
                );
              })}
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
