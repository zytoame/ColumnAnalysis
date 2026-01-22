// @ts-ignore;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { BarChart3, CheckCircle, Clock, TrendingUp, Package, AlertCircle } from 'lucide-react';

export function WorkOrderStats() {
  const [workOrderData, setWorkOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRows: 0,
    doneRows: 0,
    undoneRows: 0,
    totalWorkOrders: 0,
    doneRate: 0,
  });

  const getAuthHeader = () => {
    const raw = window?.localStorage?.getItem('token');
    const token = String(raw || '').trim();
    if (!token) return {};
    return {
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    };
  };


  // 获取工单统计数据
  const fetchWorkOrderStats = async () => {
    setLoading(true);
    try {
      const resp = await axios.get('/api/work-order/stats', {
        params: { pageNum: 1, pageSize: 50 },
        headers: {
          ...getAuthHeader(),
        },
      });
      const body = resp?.data || {};
      const data = body?.data || {};
      setWorkOrderData(Array.isArray(data.items) ? data.items : []);
      setSummary({
        totalRows: data?.summary?.totalRows || 0,
        doneRows: data?.summary?.doneRows || 0,
        undoneRows: data?.summary?.undoneRows || 0,
        totalWorkOrders: data?.summary?.totalWorkOrders || 0,
        doneRate: data?.summary?.doneRate || 0,
      });
    } catch (error) {
      console.error('【工单统计】获取工单统计数据失败, pageNum=1, pageSize=50', error);
      setWorkOrderData([]);
      setSummary({
        totalRows: 0,
        doneRows: 0,
        undoneRows: 0,
        totalWorkOrders: 0,
        doneRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchWorkOrderStats();
  }, []);

  // 进度条统一用主题色（避免蓝/绿/红等突兀色）
  const getProgressColor = () => 'bg-primary';

  const overallProgress = summary.totalRows > 0 ? (summary.doneRows / summary.totalRows * 100).toFixed(1) : 0;
  if (loading) {
    return <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            工单完成量统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            工单完成量统计
          </span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>总工单: {summary.totalWorkOrders}</span>
            <span>总数量: {summary.totalRows}</span>
            <span>已完成: {summary.doneRows}</span>
            <span>剩余: {summary.undoneRows}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 总体进度条 */}
        <div className="mb-6 rounded-lg bg-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">总体完成进度</span>
            <span className="text-sm font-bold text-foreground">{overallProgress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`} style={{
            width: `${overallProgress}%`
          }}></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>已完成 {summary.doneRows}</span>
            <span>剩余 {summary.undoneRows}</span>
          </div>
        </div>

        {/* 工单列表 */}
        <div className="space-y-4">
          {workOrderData.map((workOrder, index) => {
          const progress = workOrder.total > 0 ? (workOrder.done / workOrder.total * 100).toFixed(1) : 0;
          return <div key={workOrder.aufnr} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="whitespace-nowrap font-semibold text-foreground">{workOrder.aufnr}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className='w-48'>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`} style={{
                    width: `${progress}%`
                  }}></div>
                    </div>
                  </div>
                  <span className="w-24 whitespace-nowrap text-right text-sm font-medium text-foreground">{progress}% ({workOrder.done}/{workOrder.total})</span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded bg-secondary p-2">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-medium">总数量</span>
                    <span className="text-lg font-bold text-primary text-center">{workOrder.total}</span>
                  </div>
                </div>
                <div className="rounded bg-secondary p-2">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">已完成</span>
                    <span className="text-lg font-bold text-primary text-center">{workOrder.done}</span>
                  </div>
                </div>
                <div className="rounded bg-secondary p-2">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">剩余</span>
                    <span className="text-lg font-bold text-primary text-center">{workOrder.undone}</span>
                  </div>
                </div>
                <div className="rounded bg-secondary p-2">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">完成率</span>
                    <span className="text-lg font-bold text-primary text-center">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>;
        })}
        </div>

        {/* 空状态 */}
        {workOrderData.length === 0 && <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-1 text-lg font-medium text-foreground">暂无工单数据</h3>
            <p className="text-sm text-muted-foreground">请稍后重试</p>
          </div>}
      </CardContent>
    </Card>;
}