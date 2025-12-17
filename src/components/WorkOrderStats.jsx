// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
// @ts-ignore;
import { BarChart3, CheckCircle, Clock, TrendingUp, Package, AlertCircle } from 'lucide-react';

export function WorkOrderStats() {
  const [workOrderData, setWorkOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: 从后端获取工单统计数据
  // 需要对接SAP系统，根据柱子序列号自动匹配对应工单号及工单数量
  const fetchWorkOrderStats = async () => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // const result = await $w.cloud.callDataSource({
      //   dataSourceName: 'work_order_stats',
      //   methodName: 'wedaGetRecordsV2',
      //   params: {
      //     filter: {
      //       where: {
      //         $and: [
      //           { createBy: { $eq-current-user: true } }
      //         ]
      //       }
      //     },
      //     orderBy: [{ workOrderNumber: 'asc' }],
      //     select: { $master: true },
      //     getCount: true,
      //     pageSize: 50
      //   }
      // });
      // setWorkOrderData(result.records);

      // 临时使用模拟数据
      const mockData = [{
        workOrderNumber: 'WO202501001',
        workOrderName: '糖化模式检测工单',
        totalQuantity: 100,
        completedQuantity: 85,
        remainingQuantity: 15,
        dailyCompleted: 12,
        startDate: '2025-01-01',
        expectedEndDate: '2025-01-20',
        progress: 85
      }, {
        workOrderNumber: 'WO202501002',
        workOrderName: '地贫模式检测工单',
        totalQuantity: 80,
        completedQuantity: 60,
        remainingQuantity: 20,
        dailyCompleted: 8,
        startDate: '2025-01-05',
        expectedEndDate: '2025-01-25',
        progress: 75
      }, {
        workOrderNumber: 'WO202501003',
        workOrderName: '纯度分析检测工单',
        totalQuantity: 120,
        completedQuantity: 45,
        remainingQuantity: 75,
        dailyCompleted: 5,
        startDate: '2025-01-10',
        expectedEndDate: '2025-02-10',
        progress: 37.5
      }, {
        workOrderNumber: 'WO202501004',
        workOrderName: '稳定性测试工单',
        totalQuantity: 60,
        completedQuantity: 55,
        remainingQuantity: 5,
        dailyCompleted: 10,
        startDate: '2025-01-08',
        expectedEndDate: '2025-01-18',
        progress: 91.7
      }, {
        workOrderNumber: 'WO202501005',
        workOrderName: '杂质含量检测工单',
        totalQuantity: 90,
        completedQuantity: 30,
        remainingQuantity: 60,
        dailyCompleted: 3,
        startDate: '2025-01-12',
        expectedEndDate: '2025-02-05',
        progress: 33.3
      }];
      setWorkOrderData(mockData);
    } catch (error) {
      console.error('获取工单统计数据失败:', error);
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

  // 计算总体统计
  const totalStats = workOrderData.reduce((acc, item) => ({
    totalQuantity: acc.totalQuantity + item.totalQuantity,
    completedQuantity: acc.completedQuantity + item.completedQuantity,
    remainingQuantity: acc.remainingQuantity + item.remainingQuantity,
    dailyCompleted: acc.dailyCompleted + item.dailyCompleted
  }), {
    totalQuantity: 0,
    completedQuantity: 0,
    remainingQuantity: 0,
    dailyCompleted: 0
  });
  const overallProgress = totalStats.totalQuantity > 0 ? (totalStats.completedQuantity / totalStats.totalQuantity * 100).toFixed(1) : 0;
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
            <span>总工单: {workOrderData.length}</span>
            <span>总数量: {totalStats.totalQuantity}</span>
            <span>已完成: {totalStats.completedQuantity}</span>
            <span>剩余: {totalStats.remainingQuantity}</span>
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
            <span>已完成 {totalStats.completedQuantity}</span>
            <span>剩余 {totalStats.remainingQuantity}</span>
          </div>
        </div>

        {/* 工单列表 */}
        <div className="space-y-4">
          {workOrderData.map((workOrder, index) => <div key={workOrder.workOrderNumber} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-gray-900 whitespace-nowrap">{workOrder.workOrderNumber}</h3>
                      <span className="text-sm text-gray-600 truncate">{workOrder.workOrderName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className='w-48'>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(workOrder.progress)}`} style={{
                    width: `${workOrder.progress}%`
                  }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap w-24 text-right">{workOrder.progress}% ({workOrder.completedQuantity}/{workOrder.totalQuantity})</span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-medium">总数量</span>
                    <span className="text-lg font-bold text-blue-700 text-center">{workOrder.totalQuantity}</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">已完成</span>
                    <span className="text-lg font-bold text-green-700 text-center">{workOrder.completedQuantity}</span>
                  </div>
                </div>
                <div className="bg-orange-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">剩余</span>
                    <span className="text-lg font-bold text-orange-700 text-center">{workOrder.remainingQuantity}</span>
                  </div>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="flex items-center justify-center gap-1 text-purple-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">日完成</span>
                    <span className="text-lg font-bold text-purple-700 text-center">{workOrder.dailyCompleted}</span>
                  </div>
                </div>
              </div>
            </div>)}
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