import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
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
import { useAuth } from "@/auth/AuthProvider";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  aliases?: string[];
  keywords?: string[];
};

const navItems: NavItem[] = [
  {
    id: "main",
    label: "主页",
    icon: LayoutDashboard,
    keywords: ["zhuye", "zy"],
  },
  {
    id: "batch-audit",
    label: "批量审核",
    icon: ShieldCheck,
    keywords: ["piliangshenhe", "plsh","审核","shenhe"],
  },
  {
    id: "unqualified-reports",
    label: "不合格管理",
    icon: AlertTriangle,
    keywords: ["buhegeguanli", "bhggl"],
  },
  {
    id: "query-reports",
    label: "报告查询",
    icon: FileText,
    aliases: ["下载报告", "报告下载","下载","查询"],
    keywords: ["baogaochaxun", "bgcx", "xiazai", "xiazai baogao", "xzbg"],
  },
  {
    id: "query-columns",
    label: "层析柱查询",
    icon: Database,
    keywords: ["cengxizhuchaxun", "cxzcx","柱子","柱","层析柱","糖化"],
  },
  {
    id: "device-config",
    label: "设备连接配置",
    icon: Wrench,
    keywords: ["shebeilianjiepeizhi", "sbljpz","连接"],
  },
  {
    id: "device-message-inbox",
    label: "仪器消息修正",
    icon: Wrench,
    keywords: ["yiqixiaoxibuchong", "yqxxbc","接收"],
  },
  {
    id: "standard-manage",
    label: "标准管理",
    icon: Database,
    keywords: ["biaozhunguanli", "bzgl","标准"],
  },
  {
    id: "sn-mapping-manage",
    label: "序列号映射",
    icon: Upload,
    keywords: ["xuliehaoyingshe", "xlhys", "sn","成品序列号"],
  },
  {
    id: "unmatched-manage",
    label: "未匹配列表",
    icon: AlertTriangle,
    keywords: ["weipipeiliebiao", "wpp", "未匹配", "匹配"],
  },
  {
    id: "signature-settings",
    label: "签名配置",
    icon: Settings,
    keywords: ["qianmingpeizhi", "qmpz","签名","检验员","审核员"],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchText, setSearchText] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const auth = useAuth();
  const role = auth.role;

  // 根据角色过滤导航项
  const allowedNavItems = React.useMemo(() => {
    // 普通用户只能访问报告查询
    if (role === "CUSTOMER") {
      return navItems.filter((item) => item.id === "query-reports");
    }
    return navItems;
  }, [role]);

  React.useEffect(() => {
    const path = location.pathname || "/";
    if (path === "/wecom-login" || path === "/callback") {
      return;
    }

    if (role !== "CUSTOMER") {
      return;
    }

    if (path === "/query-reports") {
      return;
    }

    navigate("/query-reports", { replace: true });
  }, [location.pathname, navigate, role]);

  // 规范查询文本内容
  const normalizeSearchText = React.useCallback((value: string) => {
    return value.trim().replace(/^\//, "").toLowerCase();
  }, []);

  // 获取token
  const getItemTokens = React.useCallback((item: NavItem) => {
    const tokens = [item.id, item.label, ...(item.aliases || []), ...(item.keywords || [])]
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => v.toLowerCase());
    return Array.from(new Set(tokens));
  }, []);

  const suggestions = React.useMemo(() => {
    const keyword = normalizeSearchText(searchText);
    if (!keyword) {
      return [] as NavItem[];
    }
    const matched = allowedNavItems
      .map((item) => ({ item, tokens: getItemTokens(item) }))
      .filter(({ tokens }) => tokens.some((t) => t.includes(keyword)))
      .map(({ item }) => item);
    return matched.slice(0, 8);
  }, [allowedNavItems, getItemTokens, normalizeSearchText, searchText]);

  const handleSelectItem = React.useCallback(
    (item: NavItem) => {
      navigate(`/${item.id}`);
      setSearchText("");
      setSearchOpen(false);
      setActiveIndex(0);
    },
    [navigate]
  );

  const handleSearchEnter = React.useCallback(() => {
    const keyword = normalizeSearchText(searchText);
    if (!keyword) {
      return;
    }

    const matchedById = allowedNavItems.filter((item) => item.id.toLowerCase() === keyword);
    if (matchedById.length === 1) {
      navigate(`/${matchedById[0].id}`);
      setSearchText("");
      setSearchOpen(false);
      setActiveIndex(0);
      return;
    }

    const matchedByLabel = allowedNavItems.filter((item) => {
      const label = item.label.trim().toLowerCase();
      return label.includes(keyword);
    });

    if (matchedByLabel.length === 0) {
      const matchedByAliasOrKeyword = allowedNavItems.filter((item) => {
        const tokens = getItemTokens(item);
        return tokens.some((t) => t.includes(keyword));
      });

      if (matchedByAliasOrKeyword.length === 1) {
        navigate(`/${matchedByAliasOrKeyword[0].id}`);
        setSearchText("");
        setSearchOpen(false);
        setActiveIndex(0);
        return;
      }

      if (matchedByAliasOrKeyword.length > 1) {
        toast({
          title: "匹配到多个页面",
          description: `请更具体一点：${matchedByAliasOrKeyword.map((i) => i.label).join("、")}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (matchedByLabel.length === 1) {
      navigate(`/${matchedByLabel[0].id}`);
      setSearchText("");
      setSearchOpen(false);
      setActiveIndex(0);
      return;
    }

    if (matchedByLabel.length > 1) {
      toast({
        title: "匹配到多个页面",
        description: `请更具体一点：${matchedByLabel.map((i) => i.label).join("、")}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "未找到页面",
      description: "请尝试输入菜单名称（如：报告查询）或路由id（如：query-reports）",
      variant: "destructive",
    });
  }, [allowedNavItems, getItemTokens, navigate, normalizeSearchText, searchText, toast]);

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
            {allowedNavItems.map((item) => {
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
              value={searchText}
              onChange={(e) => {
                const next = e.target.value;
                setSearchText(next);
                setSearchOpen(Boolean(next.trim()));
                setActiveIndex(0);
              }}
              onFocus={() => {
                if (searchText.trim()) {
                  setSearchOpen(true);
                }
              }}
              onBlur={() => {
                setSearchOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  return;
                }

                if (e.key === "ArrowDown") {
                  if (!searchOpen) {
                    setSearchOpen(suggestions.length > 0);
                    return;
                  }
                  if (suggestions.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
                  }
                  return;
                }

                if (e.key === "ArrowUp") {
                  if (suggestions.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.max(prev - 1, 0));
                  }
                  return;
                }

                if (e.key === "Enter") {
                  if (searchOpen && suggestions.length > 0) {
                    handleSelectItem(suggestions[Math.min(activeIndex, suggestions.length - 1)]);
                    return;
                  }
                  handleSearchEnter();
                }
              }}
              placeholder="搜索页面，如：报告查询 / query-reports"
              className="h-9 bg-card pl-9"
            />

            {searchOpen && suggestions.length > 0 ? (
              <div
                className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="max-h-72 overflow-auto p-1">
                  {suggestions.map((item, index) => {
                    const active = index === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none ${
                          active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="ml-auto truncate text-xs text-muted-foreground">/{item.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5 text-foreground/70" />
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
