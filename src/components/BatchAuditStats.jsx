// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent } from '@/components/ui';
// @ts-ignore;
import { CheckCircle, Clock, Package } from 'lucide-react';

export function BatchAuditStats({
  totalColumns,
  pendingCount,
  qualifiedCount
}) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审核总数</p>
              <p className="text-2xl font-bold text-blue-600">{totalColumns}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已合格</p>
              <p className="text-2xl font-bold text-green-600">{qualifiedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>;
}