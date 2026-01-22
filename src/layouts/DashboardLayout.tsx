import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Database,
  Wrench,
  AlertTriangle,
  Upload,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { id: "main", label: "主页", icon: LayoutDashboard },
  { id: "batch-audit", label: "批量审核", icon: ShieldCheck },
  { id: "unqualified-reports", label: "不合格管理", icon: AlertTriangle },
  { id: "query-reports", label: "报告查询", icon: FileText },
  { id: "query-columns", label: "层析柱查询", icon: Database },
  { id: "device-config", label: "设备连接配置", icon: Wrench },
  { id: "device-message-inbox", label: "仪器消息补充", icon: Wrench },
  { id: "standard-manage", label: "标准管理", icon: Database },
  { id: "sn-mapping-manage", label: "序列号映射", icon: Upload },
  { id: "signature-settings", label: "签名配置", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">COA报告管理系统</div>
              <div className="truncate text-xs text-sidebar-foreground/70">
                Chromatography
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const active = location.pathname === `/${item.id}`;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                  >
                    <Link to={`/${item.id}`}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="px-3 py-4" />
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="md:hidden" />

          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="搜索..."
              className="h-9 bg-card pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5 text-foreground/70" />
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
