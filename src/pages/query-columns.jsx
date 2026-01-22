import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Checkbox,
  useToast,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { Search, Database, Loader2, FileText, Trash2 } from 'lucide-react';
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';
import { ModeTag, StatusTag } from '@/components/AntdTag.jsx';
import { generatePageNumbers } from '@/utils/pagination';
import { TEST_TYPES, PAGINATION } from '@/constants';
import columnApi from '@/api/column';
import reportApi from '@/api/report';
import { showErrorToast } from '@/utils/toast';

export default function QueryColumnsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 二次确认（替换 window.confirm）
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [batchGenerateDialogOpen, setBatchGenerateDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [selectedColumnSns, setSelectedColumnSns] = useState([]);

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [draftSearchParams, setDraftSearchParams] = useState({
    aufnr: '',
    columnSn: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    status: 'all',
  });

  const [appliedSearchParams, setAppliedSearchParams] = useState({
    aufnr: '',
    columnSn: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    status: 'all',
  });

  const fields = useMemo(
    () => [
      {
        type: 'input',
        name: 'aufnr',
        label: '工单号',
        placeholder: '请输入工单号',
      },
      {
        type: 'input',
        name: 'columnSn',
        label: '层析柱序列号',
        placeholder: '请输入层析柱序列号',
      },
      {
        type: 'input',
        name: 'deviceSn',
        label: '仪器序列号',
        placeholder: '请输入仪器序列号',
      },
      {
        type: 'select',
        name: 'mode',
        label: '检测模式',
        placeholder: '选择检测模式',
        options: [
          { value: TEST_TYPES.ALL, label: '全部模式' },
          { value: '糖化', label: '糖化模式' },
          { value: '地贫', label: '地贫模式' },
        ],
      },
      {
        type: 'select',
        name: 'status',
        label: '柱子状态',
        placeholder: '选择状态',
        options: [
          { value: 'all', label: '全部状态' },
          { value: '合格', label: '合格(待审核)' },
          { value: '不合格', label: '不合格' },
          { value: '已审核', label: '已审核' },
          { value: '已生成报告', label: '已生成报告' },
        ],
      },
    ],
    [],
  );

  const fetchColumns = useCallback(
    async (page = 1, params) => {
      setLoading(true);
      try {
        const req = {
          ...params,
          status: params.status === 'all' ? '' : params.status,
          mode: params.mode === TEST_TYPES.ALL ? '' : params.mode,
        };

        const response = await columnApi.advancedSearch(req, page, PAGINATION.DEFAULT_PAGE_SIZE);

        setColumns(response.records || []);
        setTotal(response.total || 0);
        setPageNum(page);
        setTotalPages(
          response.pages || Math.ceil((response.total || 0) / PAGINATION.DEFAULT_PAGE_SIZE),
        );

        return response;
      } catch (error) {
        console.error(`【层析柱查询】获取层析柱失败, page=${page}`,
          error);
        showErrorToast(toast, { title: '获取数据失败', description: '无法加载层析柱列表，请稍后重试' });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // 当前页的层析柱
  const currentPageColumnSns = useMemo(
    () => (columns || []).map((c) => c?.columnSn).filter(Boolean),
    [columns],
  );

  const currentPageSelection = useMemo(() => {
    const selectedSet = new Set(selectedColumnSns);
    const total = currentPageColumnSns.length;
    const selectedOnPage = currentPageColumnSns.filter((sn) => selectedSet.has(sn)).length;
    return {
      total,
      selectedOnPage,
      allChecked: total > 0 && selectedOnPage === total,
      indeterminate: selectedOnPage > 0 && selectedOnPage < total,
    };
  }, [currentPageColumnSns, selectedColumnSns]);

  const handleToggleSelectAllCurrentPage = useCallback(
    (checked) => {
      const shouldSelect = checked === true;
      setSelectedColumnSns((prev) => {
        const set = new Set(prev);
        if (shouldSelect) {
          currentPageColumnSns.forEach((sn) => set.add(sn));
        } else {
          currentPageColumnSns.forEach((sn) => set.delete(sn));
        }
        return Array.from(set);
      });
    },
    [currentPageColumnSns],
  );

  const handleToggleSelectOne = useCallback((columnSn, checked) => {
    if (!columnSn) return;
    const shouldSelect = checked === true;
    setSelectedColumnSns((prev) => {
      const set = new Set(prev);
      if (shouldSelect) {
        set.add(columnSn);
      } else {
        set.delete(columnSn);
      }
      return Array.from(set);
    });
  }, []);

  // 批量生成报告
  const doBatchGenerateReport = useCallback(
    async (mode) => {
      if ((selectedColumnSns || []).length === 0) return;
      setGenerating(true);
      try {
        const submitRes = await reportApi.submitGenerateOnlyTask(selectedColumnSns, mode);
        const taskId = submitRes?.taskId;
        if (!taskId) {
          throw new Error('未获取到任务ID');
        }

        const startedAt = Date.now();
        let task;
        while (true) {
          task = await reportApi.getTask(taskId);
          if (task?.status === 'FAILED' || task?.status === 'SUCCESS') {
            break;
          }
          if (Date.now() - startedAt > 15 * 60 * 1000) {
            throw new Error('生成超时，请稍后在列表中刷新确认');
          }
          await new Promise((r) => setTimeout(r, 1500));
        }

        const successCount = task?.success ?? 0;
        const failCount = task?.fail ?? 0;
        toast({
          title: '批量生成完成',
          description: `成功 ${successCount} 条，失败 ${failCount} 条`,
          variant: failCount > 0 ? 'destructive' : undefined,
        });

        await fetchColumns(pageNum, appliedSearchParams);
        setSelectedColumnSns([]);
        setBatchGenerateDialogOpen(false);
      } catch (error) {
        console.error(`【层析柱查询】批量生成失败, count=${selectedColumnSns.length}, mode=${mode}`,
          error);
        showErrorToast(toast, { title: '批量生成失败', description: '批量生成失败，请稍后重试' });
      } finally {
        setGenerating(false);
      }
    },
    [appliedSearchParams, fetchColumns, pageNum, selectedColumnSns, toast],
  );

  // 批量删除报告
  const doBatchDelete = useCallback(
    async (deleteMode) => {
      if ((selectedColumnSns || []).length === 0) return;
      setDeleting(true);
      try {
        let successCount = 0;
        let failCount = 0;
        const failed = {};

        for (const columnSn of selectedColumnSns) {
          try {
            const res = await columnApi.deleteByColumnSn(columnSn, deleteMode);
            if (res?.success === false) {
              throw new Error(res?.errorMsg || '删除失败');
            }
            successCount++;
          } catch (error) {
            failCount++;
            failed[columnSn] =
              error?.response?.data?.message || error?.message || '无法删除';
          }
        }

        toast({
          title: '批量删除完成',
          description: `成功 ${successCount} 条，失败 ${failCount} 条`,
          variant: failCount > 0 ? 'destructive' : undefined,
        });

        await fetchColumns(pageNum, appliedSearchParams);
        setSelectedColumnSns([]);
        setBatchDeleteDialogOpen(false);
      } catch (error) {
        console.error(`【层析柱查询】批量删除失败, count=${selectedColumnSns.length}, deleteMode=${deleteMode}`,
          error);
        showErrorToast(toast, { title: '批量删除失败', description: '批量删除失败，请稍后重试' });
      } finally {
        setDeleting(false);
      }
    },
    [appliedSearchParams, fetchColumns, pageNum, selectedColumnSns, toast],
  );

  // 搜索
  const handleSearch = useCallback(async () => {
    try {
      setAppliedSearchParams(draftSearchParams);
      setSelectedColumnSns([]);
      const response = await fetchColumns(1, draftSearchParams);
      toast({
        title: '查询完成',
        description: `找到 ${response.total || 0} 条层析柱`,
      });
    } catch (error) {
      console.error('【层析柱查询】搜索失败', error);
      showErrorToast(toast, { title: '搜索失败', description: '无法执行搜索操作，请稍后重试' });
    }
  }, [draftSearchParams, fetchColumns, toast]);

  const handleReset = useCallback(() => {
    const resetValues = {
      aufnr: '',
      columnSn: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
      status: 'all',
    };
    setDraftSearchParams(resetValues);
    setAppliedSearchParams(resetValues);
    setSelectedColumnSns([]);
    fetchColumns(1, resetValues);
  }, [fetchColumns]);

  // 返回主页
  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {},
    });
  }, [$w]);

  const handlePageChange = useCallback(
    (newPage) => {
      setPageNum(newPage);
      fetchColumns(newPage, appliedSearchParams);
    },
    [appliedSearchParams, fetchColumns],
  );

  const renderPagination = useMemo(() => {
    if (totalPages <= 1) return null;
    const pageNumbers = generatePageNumbers(pageNum, totalPages);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">共{total} 条记录，第{pageNum}/{totalPages}页</div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => pageNum > 1 && handlePageChange(pageNum - 1)}
                className={pageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={pageNum === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => pageNum < totalPages && handlePageChange(pageNum + 1)}
                className={pageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [handlePageChange, pageNum, total, totalPages]);

  useEffect(() => {
    fetchColumns(1, appliedSearchParams);
  }, []);

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">柱子查询</h1>
          <div className="mt-1 text-sm text-slate-500">查询层析柱全量信息</div>
        </div>
      </div>

      <div className="space-y-6">
        <BaseSearchFilters
          title="查询条件"
          fields={fields}
          searchParams={draftSearchParams}
          setSearchParams={setDraftSearchParams}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                柱子列表
              </span>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">当前页显示 {columns.length} 条，共 {total} 条</div>
                <div className="text-sm text-gray-500">已选择 {selectedColumnSns.length} 条</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBatchGenerateDialogOpen(true)}
                  disabled={selectedColumnSns.length === 0 || generating || deleting}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  批量生成报告
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  disabled={selectedColumnSns.length === 0 || deleting || generating}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  批量删除
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">加载中...</span>
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <Table className="table-fixed min-w-[1400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            currentPageSelection.allChecked
                              ? true
                              : currentPageSelection.indeterminate
                              ? 'indeterminate'
                              : false
                          }
                          onCheckedChange={handleToggleSelectAllCurrentPage}
                          disabled={currentPageSelection.total === 0}
                        />
                      </TableHead>
                      <TableHead className="w-40 whitespace-nowrap">成品序列号</TableHead>
                      <TableHead className="w-32 whitespace-nowrap">工单号</TableHead>
                      <TableHead className="w-32 whitespace-nowrap">仪器序列号</TableHead>
                      <TableHead className="w-24 whitespace-nowrap">检测模式</TableHead>
                      <TableHead className="w-24 whitespace-nowrap">状态</TableHead>
                      <TableHead className="w-32 whitespace-nowrap">预处理柱编号</TableHead>
                      <TableHead className="w-28 whitespace-nowrap">检测日期</TableHead>
                      <TableHead className="w-20 whitespace-nowrap">审核人</TableHead>
                      <TableHead className="w-36 whitespace-nowrap">审核时间</TableHead>
                      <TableHead className="w-24 whitespace-nowrap text-right">设置温度</TableHead>
                      <TableHead className="w-24 whitespace-nowrap text-right">系统压力</TableHead>
                      <TableHead className="w-24 whitespace-nowrap text-right">出峰时间</TableHead>
                      <TableHead className="w-20 whitespace-nowrap text-right">CV值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      columns.map((c) => (
                        <TableRow key={c.columnSn} className="hover:bg-secondary">
                          <TableCell>
                            <Checkbox
                              checked={selectedColumnSns.includes(c.columnSn)}
                              onCheckedChange={(checked) => handleToggleSelectOne(c.columnSn, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap truncate">{c.productSn || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.aufnr || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.deviceSn || '-'}</TableCell>
                          <TableCell>
                            <ModeTag mode={c.mode} />
                          </TableCell>
                          <TableCell>
                            <StatusTag status={c.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.preprocessColumnSn || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">{c.inspectionDate || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.auditor || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">{c.auditTime || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{c.setTemperature ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{c.pressure ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{c.peakTime ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{c.cvValue ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={batchGenerateDialogOpen}
          onOpenChange={(open) => {
            if (generating) return;
            setBatchGenerateDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>批量生成报告</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                选中层析柱：<span className="font-medium text-gray-900">{selectedColumnSns.length}</span> 条
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => doBatchGenerateReport('BACKUP_OVERWRITE')} disabled={generating}>
                备份后覆盖（推荐）
              </Button>
              <Button variant="secondary" onClick={() => doBatchGenerateReport('OVERWRITE_ONLY')} disabled={generating}>
                仅覆盖最新（不备份）
              </Button>
              <Button
                variant="destructive"
                onClick={() => setPurgeConfirmOpen(true)}
                disabled={generating}
              >
                清空历史后覆盖（危险）
              </Button>
              <Button
                variant="outline"
                onClick={() => setBatchGenerateDialogOpen(false)}
                disabled={generating}
              >
                取消
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={batchDeleteDialogOpen}
          onOpenChange={(open) => {
            if (deleting) return;
            setBatchDeleteDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>批量删除</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                已选择：<span className="font-medium text-gray-900">{selectedColumnSns.length}</span> 条
              </div>
              <div className="text-gray-500">注意：不会删除日志表（device_message_*）。</div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => doBatchDelete('ONLY_COLUMN')} disabled={deleting}>
                {deleting ? '处理中...' : '仅删除柱子记录（保留报告）'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteAllConfirmOpen(true)}
                disabled={deleting}
              >
                删除全部相关数据（含报告）
              </Button>
              <Button
                variant="outline"
                onClick={() => setBatchDeleteDialogOpen(false)}
                disabled={deleting}
              >
                取消
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={purgeConfirmOpen} onOpenChange={setPurgeConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空历史后覆盖生成？</AlertDialogTitle>
              <AlertDialogDescription>该操作不可恢复。</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">
              已选择：
              <span className="font-medium text-foreground">{selectedColumnSns.length}</span> 条
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setPurgeConfirmOpen(false);
                  doBatchGenerateReport('PURGE_AND_OVERWRITE');
                }}
              >
                确认执行
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除全部相关数据？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除所选柱子的相关数据（包括报告与文件），且不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">
              已选择：
              <span className="font-medium text-foreground">{selectedColumnSns.length}</span> 条
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDeleteAllConfirmOpen(false);
                  doBatchDelete('ALL_WITH_REPORT');
                }}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {total > 0 && <div className="mt-4">{renderPagination}</div>}
      </div>
    </div>
  );
}
