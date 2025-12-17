// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent } from '@/components/ui';
// @ts-ignore;
import { AlertTriangle, TrendingDown, Calendar } from 'lucide-react';

export function UnqualifiedReportStats({
  totalReports,
  todayReports,
  thisWeekReports
}) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">不合格总数</p>
              <p className="text-2xl font-bold text-red-600">{totalReports}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日新增</p>
              <p className="text-2xl font-bold text-orange-600">{todayReports}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本周新增</p>
              <p className="text-2xl font-bold text-yellow-600">{thisWeekReports}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-400" />
          </div>
        </CardContent>
      </Card>
    </div>;
}