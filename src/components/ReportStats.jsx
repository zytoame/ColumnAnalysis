// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent } from '@/components/ui';
// @ts-ignore;
import { FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export function ReportStats({
  totalReports,
  qualifiedCount,
  unqualifiedCount,
  todayReports
}) {
  return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">报告总数</p>
              <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">合格报告</p>
              <p className="text-2xl font-bold text-green-600">{qualifiedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">不合格报告</p>
              <p className="text-2xl font-bold text-red-600">{unqualifiedCount}</p>
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
              <p className="text-2xl font-bold text-purple-600">{todayReports}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </CardContent>
      </Card>
    </div>;
}