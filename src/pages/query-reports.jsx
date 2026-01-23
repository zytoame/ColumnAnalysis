import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, useToast,
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui';
import { FileText, ArrowLeft, Plus, Search, Download, Loader2 } from 'lucide-react';
import { ReportTable } from '@/components/ReportTable';
import { ReportStats } from '@/components/ReportStats';
import { SearchFilters } from '@/components/SearchFilters';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import reportApi from '@/api/report';
import { generatePageNumbers } from '@/utils/pagination';
import { TEST_TYPES, PAGINATION, TEST_RESULTS } from '@/constants';
import { showErrorToast } from '@/utils/toast';


export default function QueryReportsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const taskPollTimersRef = useRef({});

  // 状态管理
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // 预览相关状态
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // 二次确认（替换 window.confirm）
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [previewColumnSn, setPreviewColumnSn] = useState('');

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateTarget, setGenerateTarget] = useState(null);
  const [existenceInfo, setExistenceInfo] = useState(null);
  const [generating, setGenerating] = useState(false);

  // 关闭预览对话框时的清理
  const handleClosePreview = useCallback(() => {
    setPreviewDialogOpen(false);
    // 清理blob URL对象
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
    }
    setPreviewUrl('');
    setPreviewTitle('');
    setPreviewLoading(false);
    setPreviewError('');
    setPreviewColumnSn('');
  }, [previewBlobUrl]);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    GI_AUFNR: '',  // 工单号
    productSn: '',  // 成品序列号
    GI_VBELN: '',  // 订单号
    GI_RSNUM: '',  // 预留单号
    GI_ZDH: '',    // 非生产领料单号
    GI_ZBHLS: '',  // 备货单号
    reportType: 'all', // 报告类型（CN/EN）
    mode: TEST_TYPES.ALL, // 检验类型
    status: 'all', // 报告状态：all(全部), GENERATED(已生成), DOWNLOADED(已下载)
    expiryDateStart: '',
    expiryDateEnd: '',
    inspectionDateStart: '',
    inspectionDateEnd: '',
  });

  // --- hooks ---
  const selection = useSelection();
  const expand = useExpand();

  // 分页状态
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  
  // 后端已经做了分页，reports 就是当前页的数据
  const currentReports = useMemo(() => {
    return reports;
  }, [reports]);

  // 获取报告列表
  const fetchReports = useCallback(async (page = 1, currentParams) => {
    setLoading(true);
    try {
      const params = currentParams || {};
      const req = {
        ...params,
        mode: params?.mode === TEST_TYPES.ALL ? '' : params?.mode,
        status: params?.status === 'all' ? '' : params?.status,
        reportType: params?.reportType === 'all' ? '' : params?.reportType,
      };

      if (!req.expiryDateStart) delete req.expiryDateStart;
      if (!req.expiryDateEnd) delete req.expiryDateEnd;
      if (!req.inspectionDateStart) delete req.inspectionDateStart;
      if (!req.inspectionDateEnd) delete req.inspectionDateEnd;

      // 前端只暴露 productSn；后端搜索字段仍使用 columnSn（后端会同时匹配 Report.columnSn / Report.productSn）
      if (req.productSn) {
        req.columnSn = req.productSn;
        delete req.productSn;
      }
      const response = await reportApi.searchReports(
        req,
        page,
        PAGINATION.DEFAULT_PAGE_SIZE
      );

      // MyBatis-Plus Page 对象序列化后的字段：records, total, pages, current, size
      //更新数据
      const records = (response.records || []).map((r) => ({
        ...r,
        // 兼容后端可能返回的下划线字段命名
        productSn: r?.productSn ?? r?.product_sn ?? r?.productSN ?? null,
      }));
      setReports(records);
      setTotal(response.total || 0);
      setPageNum(page);
      setTotalPages(response.pages || Math.ceil((response.total || 0) / PAGINATION.DEFAULT_PAGE_SIZE));
    
      return response;
    } catch (error) {
      console.error(`【报告查询】获取报告失败, page=${page}`, error);
      showErrorToast(toast, { title: '获取数据失败', description: '无法加载报告列表，请稍后重试' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 搜索处理
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchReports(1, searchParams);

      toast({
        title: '查询完成',
        description: `找到 ${response.total} 条报告`,
      });
    } catch (error) {
      console.error('【报告查询】搜索失败', error);
      showErrorToast(toast, { title: '搜索失败', description: '无法执行搜索操作，请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, [searchParams, fetchReports, toast]);

  // 重置搜索
  const handleReset = () => {
    const resetValues = {
      GI_AUFNR: '',
      productSn: '',
      GI_VBELN: '',
      GI_RSNUM: '',  // 预留单号
      GI_ZDH: '',    // 非生产领料单号
      GI_ZBHLS: '',  // 备货单号
      reportType: 'all', // 报告类型（CN/EN）
      mode: TEST_TYPES.ALL,
      status: 'all', // 报告状态：all(全部), GENERATED(已生成), DOWNLOADED(已下载)
      expiryDateStart: '',
      expiryDateEnd: '',
      inspectionDateStart: '',
      inspectionDateEnd: '',
    };
    setSearchParams(resetValues);
    fetchReports(1, resetValues);
  };

  // 下载报告
  const handleDownload = useCallback( async (report) => {
      try {
        const columnSn = typeof report === 'string' ? report : report?.columnSn;
        const productSn = typeof report === 'string' ? '' : (report?.productSn ?? report?.product_sn ?? '');
        if (!columnSn) {
          throw new Error('缺少报告编号');
        }
        const response = await reportApi.downloadReport(columnSn);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url;
        const fileBaseName = (productSn || '').trim() || columnSn;
        link.download = `${fileBaseName}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        link.remove();
        if (columnSn) {
          toast({
            title: '下载成功',
            description: `报告 ${columnSn} 已开始下载`,
          });
        }
      } catch (error) {
        console.error(`【报告查询】下载失败, columnSn=${columnSn}, productSn=${productSn || ''}`, error);
        showErrorToast(toast, { title: '下载失败', description: '下载失败，请稍后重试' });
      }
    },
  );

  const handleDeleteReport = useCallback((report) => {
    setDeleteTarget(report || null);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteReport = useCallback(async () => {
    const report = deleteTarget;
    try {
      const id = report?.id;
      if (!id) {
        throw new Error('缺少报告id');
      }

      const label = (report?.productSn || report?.columnSn || '').toString();
      await reportApi.deleteReport(id);
      toast({
        title: '删除成功',
        description: `报告 ${label} 已删除`,
      });
      await fetchReports(pageNum, searchParams);
    } catch (error) {
      console.error(
        `【报告查询】删除失败, reportId=${report?.id ?? ''}, label=${(report?.productSn || report?.columnSn || '').toString()}`,
        error
      );
      showErrorToast(toast, { title: '删除失败', description: '删除失败，请稍后重试' });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, fetchReports, pageNum, searchParams, toast]);

  // 批量下载报告
  const handleBatchDownload = useCallback(async () => {
    if (selection.selectedItems.length === 0) {
      toast({
        title: '请选择报告',
        description: '请先选择要下载的报告',
        variant: 'destructive',
      });
      return;
    }
    try {
      const columnSns = selection.selectedItems;
      const submitRes = await reportApi.submitZipExistingTask(columnSns);
      const taskId = submitRes?.taskId;
      if (!taskId) {
        throw new Error('未获取到任务ID');
      }

      toast({
        title: '已提交批量打包任务',
        description: `任务已提交，正在后台打包 ${columnSns.length} 个已生成报告`,
      });

      const startedAt = Date.now();
      let task;
      while (true) {
        task = await reportApi.getTask(taskId);
        if (task?.status === 'FAILED' || task?.status === 'SUCCESS') {
          break;
        }
        if (Date.now() - startedAt > 15 * 60 * 1000) {
          throw new Error('打包超时，请稍后在任务中重试');
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (task?.status === 'FAILED') {
        toast({
          title: '批量打包失败',
          description: '批量打包失败，请稍后重试',
          variant: 'destructive',
        });
        return;
      }

      const response = await reportApi.downloadTaskZip(taskId);
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reports_Batch_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      const failed = task?.failed || {};
      const failedKeys = Object.keys(failed);
      if (failedKeys.length > 0) {
        const sample = failedKeys.slice(0, 3).join(', ');
        toast({
          title: '部分报告未打包',
          description: `成功 ${task?.success ?? 0} 个，失败 ${failedKeys.length} 个（如：${sample}${failedKeys.length > 3 ? ' ...' : ''}）`,
          variant: 'destructive',
        });
      }

      toast({
        title: '批量下载完成',
        description: `已开始下载 ${columnSns.length} 个报告的压缩包`,
      });

      selection.clearSelection();
    } catch (error) {
      console.error(`【报告查询】批量下载失败, count=${selection.selectedItems.length}`,
        error);
      showErrorToast(toast, { title: '批量下载失败', description: '批量下载失败，请稍后重试' });
    }
  }, [selection, toast]);

  // 预览报告（在对话框中显示）
  const handlePreview = useCallback(async (report) => {
      try {
        setPreviewLoading(true);
        setPreviewError('');
        setPreviewColumnSn(report.columnSn);
        const response = await reportApi.previewReport(report.columnSn);

        const contentType = response?.headers?.['content-type'] || '';
        if (!contentType.includes('pdf')) {
          throw new Error('后端返回的不是PDF文件，无法预览');
        }
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);

        setPreviewBlobUrl(blobUrl); // 保存blobUrl用于后续清理
        setPreviewUrl(blobUrl);
        setPreviewTitle(`报告预览 - ${report.columnSn}`);
        setPreviewDialogOpen(true);

        toast({
          title: '预览成功',
          description: '报告已加载完成',
        });

      } catch (error) {
        console.error(`【报告查询】预览失败, columnSn=${report?.columnSn || ''}`,
          error);
        setPreviewError(error.response?.data?.message || error.message || '无法加载报告');
        showErrorToast(toast, { title: '预览失败', description: '无法加载报告，请稍后重试' });
      } finally {
        setPreviewLoading(false);
      }
    },
    [toast]
  );

  const doGenerateReport = useCallback(
    async (columnSn, mode) => {
      if (!columnSn) return;
      setGenerating(true);
      try {
        const submitRes = await reportApi.submitGenerateOnlyTask([columnSn], mode);
        const taskId = submitRes?.taskId;
        if (!taskId) {
          throw new Error('未获取到任务ID');
        }

        // 提交成功即恢复可操作，不阻塞页面等待任务完成

        setGenerateDialogOpen(false);
        setExistenceInfo(null);
        setGenerateTarget(null);
        setGenerating(false);

        // 后台轮询任务状态（不 await，不影响交互）
        const startedAt = Date.now();
        const poll = async () => {
          try {
            const task = await reportApi.getTask(taskId);
            if (task?.status === 'FAILED') {
              const failedMsg = task?.failed?.[columnSn];
              toast({
                title: '生成失败',
                description: failedMsg || `报告 ${columnSn} 生成失败`,
                variant: 'destructive',
              });
              return;
            }
            if (task?.status === 'SUCCESS') {
              toast({
                title: '生成完成',
                description: `报告 ${columnSn} 已生成完成`,
              });
              fetchReports(pageNum, searchParams);
              return;
            }
            if (Date.now() - startedAt > 5 * 60 * 1000) {
              toast({
                title: '生成超时',
                description: `报告 ${columnSn} 生成时间较长，请稍后手动刷新列表确认`,
                variant: 'destructive',
              });
              return;
            }
            taskPollTimersRef.current[taskId] = window.setTimeout(poll, 1000);
          } catch (e) {
            console.error(`【报告查询】查询任务失败, taskId=${taskId}, columnSn=${columnSn}`, e);
            toast({
              title: '任务状态查询失败',
              description: `报告 ${columnSn} 已在后台生成，可稍后刷新列表确认`,
              variant: 'destructive',
            });
          }
        };

        taskPollTimersRef.current[taskId] = window.setTimeout(poll, 500);
      } catch (error) {
        console.error(`【报告查询】生成报告失败, columnSn=${columnSn}, mode=${mode}`,
          error);
        showErrorToast(toast, { title: '生成失败', description: '生成失败，请稍后重试' });
      } finally {
        setGenerating(false);
      }
    },
    [fetchReports, pageNum, searchParams, toast]
  );

  const handleGenerate = useCallback(
    async (report) => {
      try {
        const columnSn = report?.columnSn;
        if (!columnSn) return;
        setGenerateTarget(report);
        setExistenceInfo(null);
        setGenerateDialogOpen(true);
      } catch (error) {
        console.error(`【报告查询】检查报告失败, columnSn=${report?.columnSn || ''}`,
          error);
        showErrorToast(toast, { title: '操作失败', description: '无法检查报告状态，请稍后重试' });
      }
    },
    [doGenerateReport, toast]
  );

  // 返回主页
  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {},
    });
  }, [$w]);

  // 处理分页
  const handlePageChange = useCallback((newPage) => {
    setPageNum(newPage);
    fetchReports(newPage, searchParams);
  }, [searchParams, fetchReports]);

  // 分页组件
  const renderPagination = useMemo(() => {
    if (totalPages <= 1) return null;
    const pageNumbers = generatePageNumbers(pageNum, totalPages);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          共{total} 条记录，第{pageNum}/{totalPages}页
        </div>
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
                className={
                  pageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [pageNum, totalPages, handlePageChange, total]);

  // 计算统计数据
  const qualifiedCount = useMemo(
    () => reports.filter((r) => r.testResult === TEST_RESULTS.QUALIFIED).length,
    [reports]
  );
  const unqualifiedCount = useMemo(
    () => reports.filter((r) => r.testResult === TEST_RESULTS.UNQUALIFIED).length,
    [reports]
  );
  const todayReports = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reports.filter((r) => r.submitTime?.startsWith(today)).length;
  }, [reports]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchReports(1, searchParams);
  }, []);

  // 清理后台轮询定时器，避免页面卸载后继续请求
  useEffect(() => {
    return () => {
      const timers = taskPollTimersRef.current || {};
      Object.values(timers).forEach((t) => {
        if (t) {
          window.clearTimeout(t);
        }
      });
      taskPollTimersRef.current = {};
    };
  }, []);

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">报告查询</h1>
          <div className="mt-1 text-sm text-slate-500">查询和管理层析柱检测报告</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 统计概览 */}
        <ReportStats
          totalReports={reports.length}
          qualifiedCount={qualifiedCount}
          unqualifiedCount={unqualifiedCount}
          todayReports={todayReports}
        />

        {/* 搜索区域 */}
        <SearchFilters
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        {/* 批量操作 */}
        {selection.selectedItems.length > 0 && (
          <Card className="mb-6 bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    已选择 {selection.selectedItems.length} 个报告
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selection.clearSelection}>
                    取消选择
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchDownload}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    批量下载
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 报告列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                报告列表
              </span>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  当前页显示 {currentReports.length} 条，共 {total} 个报告
                </div>
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
              <ReportTable
                reports={currentReports}
                selectedReports={selection.selectedItems}
                onSelectReport={(sn) => selection.toggleSelection(sn)}
                onSelectAll={(checked) =>
                  selection.toggleSelectAll(
                    currentReports.map((r) => ({ id: r.columnSn })),
                    checked
                  )
                }
                onPreview={handlePreview}
                onGenerate={handleGenerate}
                onDownload={handleDownload}
                onDelete={handleDeleteReport}
              />
            )}
          </CardContent>
        </Card>

        {/* 分页组件 */}
        {total > 0 && <div className="mt-4">{renderPagination}</div>}

        {/* 空状态 */}
        {!loading && reports.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无报告</h3>
              <p className="text-gray-500 mb-4">还没有生成任何检测报告</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 报告预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{previewTitle}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(previewColumnSn)}
                disabled={!previewColumnSn}
              >
                <Download className="h-4 w-4 mr-2" />
                下载文件
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">加载中...</span>
              </div>
            ) : previewError ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-gray-500">{previewError}</span>
              </div>
            ) : previewUrl ? (
              <div className="w-full h-full flex flex-col min-h-0">
                <div className="text-sm text-gray-600 mb-2 rounded bg-secondary p-2">
                  如果预览不显示，请尝试下载文件进行查看。
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full flex-1 min-h-0 border-0"
                  title="报告预览"
                  onLoad={() => {
                    if (import.meta.env.DEV) {
                      console.log('报告预览已加载');
                    }
                  }}
                  onError={(e) => {
                    console.error(
                      `【报告查询】预览加载失败, columnSn=${previewColumnSn || ''}`,
                      e
                    );
                  }}
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* 报告生成对话框 */}
      <Dialog
        open={generateDialogOpen}
        onOpenChange={(open) => {
          setGenerateDialogOpen(open);
          if (!open) {
            setExistenceInfo(null);
            setGenerateTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>报告已存在</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              当前层析柱：
              <span className="font-medium text-gray-900">{generateTarget?.columnSn}</span>
            </div>
            <div>
              当前报告ID：
              <span className="font-medium text-gray-900">{existenceInfo?.currentReportId}</span>
            </div>
            <div>
              历史备份数量：
              <span className="font-medium text-gray-900">{existenceInfo?.backupCount ?? 0}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              disabled={!generateTarget?.columnSn}
              onClick={() => handlePreview(generateTarget)}
            >
              预览当前报告
            </Button>
            <Button onClick={() => doGenerateReport(generateTarget?.columnSn, 'BACKUP_OVERWRITE')}>
              备份后覆盖（推荐）
            </Button>
            <Button
              variant="secondary"
              onClick={() => doGenerateReport(generateTarget?.columnSn, 'OVERWRITE_ONLY')}
            >
              仅覆盖最新（不备份）
            </Button>
            <Button
              variant="destructive"
              onClick={() => setPurgeConfirmOpen(true)}
            >
              清空历史后覆盖（危险）
            </Button>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除报告？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将同时删除报告文件，且不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground">
            报告：
            <span className="font-medium text-foreground">
              {(deleteTarget?.productSn || deleteTarget?.columnSn || '').toString() || '-'}
            </span>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReport}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeConfirmOpen} onOpenChange={setPurgeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空历史后覆盖生成？</AlertDialogTitle>
            <AlertDialogDescription>该操作不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground">
            当前层析柱：
            <span className="font-medium text-foreground">{generateTarget?.columnSn || '-'}</span>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPurgeConfirmOpen(false);
                doGenerateReport(generateTarget?.columnSn, 'PURGE_AND_OVERWRITE');
              }}
            >
              确认执行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}