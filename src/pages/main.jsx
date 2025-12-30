import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, useToast } from '@/components/ui';
import { FileText, Search, CheckCircle, AlertTriangle, Shield, ArrowRight, Clock, Database, PenTool } from 'lucide-react';
import { WorkOrderStats } from '@/components/WorkOrderStats';
import { AntdTag } from '@/components/AntdTag.jsx';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES } from '@/constants';
import reportApi from '@/api/report';

// 当前用户信息
const currentUser = {
  name: '管理员',
  type: USER_TYPES.ADMIN,
};

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
        stats: {
          total: statistics.unqualifiedReports,
        },
        pageId: 'unqualified-reports',
      },
      {
        id: 'batch-audit',
        title: '批量审核签字',
        description: '批量审核待审核的层析柱',
        icon: CheckCircle,
        color: 'green',
        stats: {
          pending: statistics.pendingReports,
          completed: statistics.approvedReports,
        },
        pageId: 'batch-audit',
      },
      {
        id: 'query-reports',
        title: '下载报告',
        description: '查询和下载各类检测报告',
        icon: Search,
        color: 'blue',
        stats: {
          total: statistics.totalReports,
        },
        pageId: 'query-reports',
      },
      {
        id: 'query-columns',
        title: '层析柱查询',
        description: '查询层析柱全量信息',
        icon: Database,
        color: 'blue',
        stats: {
          total: '-',
        },
        pageId: 'query-columns',
      },
      {
        id: 'standard-manage',
        title: '标准/模板管理',
        description: '新增、编辑与维护层析柱标准模板',
        icon: PenTool,
        color: 'blue',
        stats: {
          total: '-',
        },
        pageId: 'standard-manage',
      },
    ];
  }, [statistics]);

  // TODO: 从后端获取最近活动记录
  // 需要调用接口获取用户的操作历史
  const fetchRecentActivities = useCallback(async () => {
    try {
      // TODO: 替换为实际的数据源调用
      // const result = await $w.cloud.callDataSource({
      //   dataSourceName: 'audit_records',
      //   methodName: 'wedaGetRecordsV2',
      //   params: {
      //     filter: {
      //       where: {
      //         $and: [
      //           { createBy: { $eq-current-user: true } }
      //         ]
      //       }
      //     },
      //     orderBy: [{ createdAt: 'desc' }],
      //     select: { $master: true },
      //     pageSize: 10
      //   }
      // });
      // setRecentActivities(result.records);
    } catch (error) {
      console.error('获取最近活动失败:', error);
    }
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
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
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
    <div style={style} className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">报告管理系统</h1>
              <p className="text-sm text-gray-500">欢迎回来，{currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AntdTag
              label={getUserTypeLabel(currentUser.type)}
              color="sky"
              showDot={false}
              prefix={<Shield className="w-3 h-3 mr-1" />}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 功能模块 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">功能模块</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {functionModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-blue-300"
                  onClick={() => handleNavigateToPage(module.pageId, module.title)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${getIconBgColor(module.color)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">{module.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* 统计信息 */}
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(module.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-500">
                            {statLabelMap[key] || key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 工单完成量统计 */}
        <WorkOrderStats />

        {/* 最近活动 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              最近活动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === 'audit'
                          ? 'bg-green-500'
                          : activity.type === 'generate'
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无最近活动</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
