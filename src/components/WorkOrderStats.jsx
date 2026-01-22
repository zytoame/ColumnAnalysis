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

  // 获取进度条颜色
  const getProgressColor = progress => {
    if (progress >= 85) return 'bg-lime-500';
    if (progress >= 60) return 'bg-blue-300';
    if (progress >= 30) return 'bg-yellow-400';
    return 'bg-red-300';
  };

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">加载中...</span>
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
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>总工单: {summary.totalWorkOrders}</span>
            <span>总数量: {summary.totalRows}</span>
            <span>已完成: {summary.doneRows}</span>
            <span>剩余: {summary.undoneRows}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 总体进度条 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">总体完成进度</span>
            <span className="text-sm font-bold text-gray-900">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(overallProgress)}`} style={{
            width: `${overallProgress}%`
          }}></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已完成 {summary.doneRows}</span>
            <span>剩余 {summary.undoneRows}</span>
          </div>
        </div>

        {/* 工单列表 */}
        <div className="space-y-4">
          {workOrderData.map((workOrder, index) => {
          const progress = workOrder.total > 0 ? (workOrder.done / workOrder.total * 100).toFixed(1) : 0;
          return <div key={workOrder.aufnr} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-gray-900 whitespace-nowrap">{workOrder.aufnr}</h3>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className='w-48'>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`} style={{
                    width: `${progress}%`
                  }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap w-24 text-right">{progress}% ({workOrder.done}/{workOrder.total})</span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-medium">总数量</span>
                    <span className="text-lg font-bold text-blue-700 text-center">{workOrder.total}</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">已完成</span>
                    <span className="text-lg font-bold text-green-700 text-center">{workOrder.done}</span>
                  </div>
                </div>
                <div className="bg-orange-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">剩余</span>
                    <span className="text-lg font-bold text-orange-700 text-center">{workOrder.undone}</span>
                  </div>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">完成率</span>
                    <span className="text-lg font-bold text-purple-700 text-center">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>;
        })}
        </div>

        {/* 空状态 */}
        {workOrderData.length === 0 && <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无工单数据</h3>
            <p className="text-gray-500 text-sm">请稍后重试或联系管理员</p>
          </div>}
      </CardContent>
    </Card>;
}