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
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">不合格总数</p>
              <p className="text-2xl font-bold text-primary">{totalReports}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">今日新增</p>
              <p className="text-2xl font-bold text-primary">{todayReports}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">本周新增</p>
              <p className="text-2xl font-bold text-primary">{thisWeekReports}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-primary/70" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}