// @ts-ignore;
import React, { useState, useEffect } from 'react';
import http from '@/lib/http';
// @ts-ignore;
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
// @ts-ignore;
import { BarChart3, CheckCircle, Clock, TrendingUp, Package, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { showErrorToast } from '@/utils/toast';

export function WorkOrderStats() {
  const { toast } = useToast();
  const [workOrderData, setWorkOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAufnr, setSelectedAufnr] = useState('');
  const [summary, setSummary] = useState({
    totalRows: 0,
    doneRows: 0,
    undoneRows: 0,
    totalWorkOrders: 0,
    doneRate: 0,
  });

  const HIDDEN_WORK_ORDER_KEY = 'COA_HIDDEN_WORK_ORDERS';
  const DONE_MONTH_KEY = 'COA_WORK_ORDER_DONE_MONTH';

  const getCurrentYearMonth = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const loadHiddenSet = () => {
    try {
      const raw = localStorage.getItem(HIDDEN_WORK_ORDER_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      return new Set();
    }
  };

  const saveHiddenSet = (set) => {
    localStorage.setItem(HIDDEN_WORK_ORDER_KEY, JSON.stringify(Array.from(set)));
  };

  const loadDoneMonthMap = () => {
    try {
      const raw = localStorage.getItem(DONE_MONTH_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      return {};
    }
  };

  const saveDoneMonthMap = (map) => {
    localStorage.setItem(DONE_MONTH_KEY, JSON.stringify(map || {}));
  };


  // 获取工单统计数据
  const fetchWorkOrderStats = async () => {
    setLoading(true);
    try {
      const resp = await http.get('/work-order/stats', {
        params: { pageNum: 1, pageSize: 50 },
      });
      const body = resp?.data || {};
      const data = body?.data || {};

      const items = Array.isArray(data.items) ? data.items : [];
      const doneMonthMap = loadDoneMonthMap();
      const currentMonth = getCurrentYearMonth();
      let changed = false;
      (items || []).forEach((it) => {
        const aufnr = it?.aufnr;
        if (!aufnr) return;
        const total = Number(it?.total || 0);
        const done = Number(it?.done || 0);
        const isDone = total > 0 && done >= total;
        if (isDone && !doneMonthMap[aufnr]) {
          doneMonthMap[aufnr] = currentMonth;
          changed = true;
        }
      });
      if (changed) {
        saveDoneMonthMap(doneMonthMap);
      }

      setWorkOrderData(items);
      setSummary({
        totalRows: data?.summary?.totalRows || 0,
        doneRows: data?.summary?.doneRows || 0,
        undoneRows: data?.summary?.undoneRows || 0,
        totalWorkOrders: data?.summary?.totalWorkOrders || 0,
        doneRate: data?.summary?.doneRate || 0,
      });
    } catch (error) {
      console.error('【工单统计】获取工单统计数据失败, pageNum=1, pageSize=50', error);
      showErrorToast(toast, { title: '获取数据失败', description: '无法加载工单统计，请稍后重试' });
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

  // 进度条统一用主题色
  const getProgressColor = () => 'bg-primary';

  const visibleWorkOrders = (() => {
    const hiddenSet = loadHiddenSet();
    const doneMonthMap = loadDoneMonthMap();
    const currentMonth = getCurrentYearMonth();
    return (workOrderData || []).filter((it) => {
      const aufnr = it?.aufnr;
      if (!aufnr) return false;
      if (hiddenSet.has(aufnr)) return false;

      const total = Number(it?.total || 0);
      const done = Number(it?.done || 0);
      const isDone = total > 0 && done >= total;
      if (!isDone) return true;

      const doneMonth = doneMonthMap[aufnr];
      if (!doneMonth) return true;
      return doneMonth === currentMonth;
    });
  })();

  const displaySummary = (() => {
    const s = (visibleWorkOrders || []).reduce(
      (acc, it) => {
        const total = Number(it?.total || 0);
        const done = Number(it?.done || 0);
        const undone = Number(it?.undone || 0);
        return {
          totalWorkOrders: acc.totalWorkOrders + 1,
          totalRows: acc.totalRows + total,
          doneRows: acc.doneRows + done,
          undoneRows: acc.undoneRows + undone,
        };
      },
      { totalWorkOrders: 0, totalRows: 0, doneRows: 0, undoneRows: 0 },
    );
    const doneRate = s.totalRows > 0 ? Number(((s.doneRows / s.totalRows) * 100).toFixed(1)) : 0;
    return {
      ...s,
      doneRate,
    };
  })();

  const overallProgress = displaySummary.totalRows > 0 ? (displaySummary.doneRows / displaySummary.totalRows * 100).toFixed(1) : 0;

  const handleConfirmHide = () => {
    if (!selectedAufnr) return;
    try {
      const hiddenSet = loadHiddenSet();
      hiddenSet.add(selectedAufnr);
      saveHiddenSet(hiddenSet);
      setConfirmOpen(false);
      setSelectedAufnr('');
      toast({ title: '已隐藏', description: `工单 ${selectedAufnr} 已从统计列表中隐藏` });
    } catch (e) {
      showErrorToast(toast, { title: '操作失败', description: '隐藏失败，请稍后重试' });
    }
  };
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
      <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          工单完成量统计
        </span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">总工单: {displaySummary.totalWorkOrders}</span>
          <span className="whitespace-nowrap">总数量: {displaySummary.totalRows}</span>
          <span className="whitespace-nowrap">已完成: {displaySummary.doneRows}</span>
          <span className="whitespace-nowrap">剩余: {displaySummary.undoneRows}</span>
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
          <span>已完成 {displaySummary.doneRows}</span>
          <span>剩余 {displaySummary.undoneRows}</span>
        </div>
      </div>

      {/* 工单列表 */}
      <div className="space-y-4">
        {visibleWorkOrders.map((workOrder, index) => {
        const progress = workOrder.total > 0 ? (workOrder.done / workOrder.total * 100).toFixed(1) : 0;
        return <div key={workOrder.aufnr} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="truncate font-semibold text-foreground" title={workOrder.aufnr || ''}>{workOrder.aufnr}</h3>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:flex-nowrap md:justify-end">
                <div className="flex-1 min-w-[120px] md:min-w-[160px] md:w-48 md:flex-none">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`} style={{
                  width: `${progress}%`
                }}></div>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">{progress}% ({workOrder.done}/{workOrder.total})</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    setSelectedAufnr(workOrder.aufnr);
                    setConfirmOpen(true);
                  }}
                  title="隐藏该工单"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
      {visibleWorkOrders.length === 0 && <div className="py-8 text-center">
          {/* <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" /> */}
          <h3 className="mb-1 text-lg font-medium text-foreground">暂无工单数据</h3>
          {/* <p className="text-sm text-muted-foreground">请稍后重试</p> */}
        </div>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认隐藏工单？</AlertDialogTitle>
            <AlertDialogDescription>
              隐藏后该工单在此页面不再显示。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedAufnr('');
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHide}>确认隐藏</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>;
}