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
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">待审核总数</p>
              <p className="text-2xl font-bold text-primary">{totalColumns}</p>
            </div>
            <Package className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">待处理</p>
              <p className="text-2xl font-bold text-primary">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">已合格</p>
              <p className="text-2xl font-bold text-primary">{qualifiedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}