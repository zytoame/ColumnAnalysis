import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
} from '@/components/ui';
import { FileText, Search, CheckCircle, AlertTriangle, Shield, ArrowRight, Clock, Database, PenTool, Cpu, Wrench } from 'lucide-react';
import { WorkOrderStats } from '@/components/WorkOrderStats';
import reportApi from '@/api/report';

export default function MainPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 状态管理
  const [recentActivities, setRecentActivities] = useState([]);
  const [statistics, setStatistics] = useState({
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    unqualifiedReports: 0,
  });

  const functionModules = useMemo(() => {
    return [
      {
        id: 'unqualified-reports',
        title: '不合格层析柱管理',
        description: '管理和编辑不合格的层析柱检测数据',
        icon: AlertTriangle,
        color: 'red',
        // stats: {
        //   total: statistics.unqualifiedReports,
        // },
        pageId: 'unqualified-reports',
      },
      {
        id: 'batch-audit',
        title: '批量审核签字',
        description: '批量审核待审核的层析柱',
        icon: CheckCircle,
        color: 'green',
        // stats: {
        //   pending: statistics.pendingReports,
        //   completed: statistics.approvedReports,
        // },
        pageId: 'batch-audit',
      },
      {
        id: 'query-reports',
        title: '下载报告',
        description: '查询和下载各类检测报告',
        icon: Search,
        color: 'blue',
        // stats: {
        //   total: statistics.totalReports,
        // },
        pageId: 'query-reports',
      },
      {
        id: 'query-columns',
        title: '层析柱查询',
        description: '查询层析柱全量信息',
        icon: Database,
        color: 'blue',
        pageId: 'query-columns',
      },
      {
        id: 'standard-manage',
        title: '标准/模板管理',
        description: '新增、编辑与维护层析柱标准模板',
        icon: PenTool,
        color: 'blue',
        pageId: 'standard-manage',
      },
      {
        id: 'signature-settings',
        title: '签名配置',
        description: '设置检验员/审核员签名工号',
        icon: PenTool,
        color: 'blue',
        pageId: 'signature-settings',
      },
      {
        id: 'device-config',
        title: '设备连接配置',
        description: '配置机器IP/端口/连接模式，并手动连接与断开',
        icon: Cpu,
        color: 'blue',
        pageId: 'device-config',
      },
      {
        id: 'device-message-inbox',
        title: '设备消息收件箱',
        description: '查看接收到的raw消息，补录缺失字段并二次确认',
        icon: Wrench,
        color: 'blue',
        pageId: 'device-message-inbox',
      },
      {
        id: 'sn-mapping-manage',
        title: 'SN映射管理',
        description: '上传Excel导入成品序列号与自编序列号映射',
        icon: Database,
        color: 'blue',
        pageId: 'sn-mapping-manage',
      },
    ];
  }, [statistics]);

  const fetchRecentActivities = useCallback(async () => {
    setRecentActivities([]);
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await reportApi.getStatistics();
      const data = response?.data || {};
      setStatistics({
        totalReports: data.totalReports || 0,
        approvedReports: data.approvedReports || 0,
        pendingReports: data.pendingReports || 0,
        unqualifiedReports: data.unqualifiedReports || 0,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchRecentActivities();
    fetchStatistics();
  }, [fetchRecentActivities, fetchStatistics]);

  // 页面跳转处理
  const handleNavigateToPage = useCallback(
    (pageId, moduleName) => {
      try {
        $w?.utils.navigateTo({
          pageId: pageId,
          params: {
            from: 'main',
          },
        });
      } catch (error) {
        toast({
          title: '跳转失败',
          description: `无法跳转到${moduleName}页面，请稍后重试`,
          variant: 'destructive',
        });
      }
    },
    [$w, toast]
  );

  // 获取图标背景色
  const getIconBgColor = useCallback((color) => {
    const colorMap = {
      red: 'bg-secondary text-primary',
      blue: 'bg-secondary text-primary',
      green: 'bg-secondary text-primary',
    };
    return colorMap[color] || colorMap.blue;
  }, []);

  // 统计标签映射
  const statLabelMap = useMemo(
    () => ({
      total: '总计',
      pending: '待处理',
      today: '今日',
      thisWeek: '本周',
      completed: '已完成',
    }),
    []
  );

  return (
    <div style={style} className="space-y-6">
      

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">报告总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{statistics.totalReports}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{statistics.approvedReports}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{statistics.pendingReports}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">不合格</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">{statistics.unqualifiedReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">工单完成量统计</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkOrderStats />
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {functionModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/30"
                  onClick={() => handleNavigateToPage(module.pageId, module.title)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${getIconBgColor(module.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">{module.title}</div>
                      <div className="truncate text-xs text-slate-500">{module.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-600" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
