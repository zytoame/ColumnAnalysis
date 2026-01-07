import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { CheckCircle, ArrowLeft, PenTool, XCircle, Loader2, FileCheck, User, Thermometer, Gauge, Timer, Activity, Package } from 'lucide-react';
import { BatchAuditTable } from '@/components/BatchAuditTable';
import { BatchAuditStats } from '@/components/BatchAuditStats';
import { BatchSearchFilters } from '@/components/BatchSearchFilters';
import { DetailModal } from '@/components/DetailModal';
import { AntdTag, ConclusionTag } from '@/components/AntdTag.jsx';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, TEST_TYPES, PAGINATION, CONCLUSION_STATUS } from '@/constants';
import columnApi from '@/api/column';
import reportApi from '@/api/report';



export default function BatchAuditPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 分批，将数组分成多个子数组
  const chunkArray = useCallback((arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }, []);

  // 状态管理
  const [pendingColumns, setPendingColumns] = useState([]);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingColumn, setViewingColumn] = useState(null);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [postApproveDialogOpen, setPostApproveDialogOpen] = useState(false);
  const [approvedColumnSns, setApprovedColumnSns] = useState([]);
  const [generatingAfterApprove, setGeneratingAfterApprove] = useState(false);

  const [standardCache, setStandardCache] = useState({});

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    aufnr: '',
    columnSn: '',
    vbeln: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
  });

  const selection = useSelection();
  const expand = useExpand();

  // 当前用户信息
  const currentUser = useMemo(
    () => ({
      name: '管理员',
      type: USER_TYPES.ADMIN,
    }),
    []
  );

  // 列表项转UI
  const mapColumnToUi = useCallback((c) => {
    const finalConclusion = c?.status === '合格' ? CONCLUSION_STATUS.QUALIFIED : CONCLUSION_STATUS.UNQUALIFIED;
    return {
      ...c,
      id: c?.columnSn,
      finalConclusion,
      detectionData: {
        setTemperature: {
          standard: '-',
          result: c?.setTemperature != null ? `${c.setTemperature}` : '-',
          conclusion: c?.status === '合格' ? 'pass' : 'fail',
          icon: 'Thermometer',
        },
        pressure: {
          standard: '-',
          result: c?.pressure != null ? `${c.pressure}` : '-',
          conclusion: c?.status === '合格' ? 'pass' : 'fail',
          icon: 'Gauge',
        },
        peakTime: {
          standard: '-',
          result: c?.peakTime != null ? `${c.peakTime}` : '-',
          conclusion: c?.status === '合格' ? 'pass' : 'fail',
          icon: 'Timer',
        },
        repeatabilityTest: {
          standard: '-',
          result: c?.cvValue != null ? `${c.cvValue}%` : '-',
          conclusion: c?.status === '合格' ? 'pass' : 'fail',
          icon: 'Activity',
        },
      },
    };
  }, []);

  // 格式化范围
  const formatRange = useCallback((min, max) => {
    const minV = min == null ? null : `${min}`;
    const maxV = max == null ? null : `${max}`;
    if (minV == null && maxV == null) return '-';
    if (minV != null && maxV != null) return `${minV} ~ ${maxV}`;
    if (minV != null) return `>= ${minV}`;
    return `<= ${maxV}`;
  }, []);

  // 应用标准
  const applyStandardToColumns = useCallback((columnSn, standard) => {
    const standardText = {
      setTemperature: formatRange(standard?.minTemperature, standard?.maxTemperature),
      pressure: formatRange(standard?.minPressure, standard?.maxPressure),
      peakTime: formatRange(standard?.minPeakTime, standard?.maxPeakTime),
      repeatabilityTest: standard?.maxCv != null ? `<= ${standard.maxCv}%` : '-',
    };

    const patchOne = (col) => {
      if (col?.columnSn !== columnSn) return col;
      const d = col?.detectionData || {};
      return {
        ...col,
        detectionData: {
          ...d,
          setTemperature: { ...(d.setTemperature || {}), standard: standardText.setTemperature },
          pressure: { ...(d.pressure || {}), standard: standardText.pressure },
          peakTime: { ...(d.peakTime || {}), standard: standardText.peakTime },
          repeatabilityTest: {
            ...(d.repeatabilityTest || {}),
            standard: standardText.repeatabilityTest,
          },
        },
      };
    };

    setPendingColumns((prev) => prev.map(patchOne));
    setFilteredColumns((prev) => prev.map(patchOne));
  }, [formatRange]);

  // 获取并缓存标准
  const fetchAndCacheStandard = useCallback(async (columnSn) => {
    if (!columnSn) return null;
    if (standardCache[columnSn]) return standardCache[columnSn];

    const response = await columnApi.getColumnStandard(columnSn);
    const body = response?.data;
    const standard = body?.data ?? null;
    if (!body?.success || !standard) {
      throw new Error(body?.errorMsg || '未获取到标准');
    }
    setStandardCache((prev) => ({ ...prev, [columnSn]: standard }));
    return standard;
  }, [standardCache]);

  // 切换展开/折叠
  const handleToggleExpandWithStandard = useCallback(async (columnSn) => {
    const isExpanded = expand.expandedItems.includes(columnSn);
    if (isExpanded) {
      expand.toggleExpand(columnSn);
      return;
    }

    try {
      const standard = await fetchAndCacheStandard(columnSn);
      if (standard) applyStandardToColumns(columnSn, standard);
    } catch (error) {
      console.error('获取层析柱标准失败:', error);
      toast({
        title: '获取标准失败',
        description: '无法加载该层析柱的标准值，将以“-”显示',
        variant: 'destructive',
      });
    } finally {
      expand.toggleExpand(columnSn);
    }
  }, [applyStandardToColumns, expand, fetchAndCacheStandard, toast]);

  // 当前页数据（后端已分页）
  const currentColumns = useMemo(() => filteredColumns, [filteredColumns]);

  // 获取待审核层析柱
  const fetchPendingColumns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await columnApi.getPendingReviewColumns(page, PAGINATION.DEFAULT_PAGE_SIZE);
      const data = response?.data || {};
      const records = (data.records || []).map(mapColumnToUi);

      setPendingColumns(records);
      setFilteredColumns(records);
      setPageNum(page);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 0);
    } catch (error) {
      console.error('获取待审核层析柱失败:', error);
      toast({
        title: '获取数据失败',
        description: '无法加载待审核层析柱列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [mapColumnToUi, toast]);

  // 搜索
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        status: '合格',
        mode: searchParams.mode === TEST_TYPES.ALL ? '' : searchParams.mode,
      };

      const response = await columnApi.advancedSearch(params, 1, PAGINATION.DEFAULT_PAGE_SIZE);

      setFilteredColumns((response.records || []).map(mapColumnToUi));
      setPendingColumns((response.records || []).map(mapColumnToUi));
      setPageNum(1);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 0);

      toast({
        title: '查询完成',
        description: `找到 ${response.total || 0} 条待审核层析柱`,
      });
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: '搜索失败',
        description: '无法执行搜索操作',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [mapColumnToUi, searchParams, toast]);

  // 重置搜索
  const handleReset = useCallback(() => {
    setSearchParams({
      aufnr: '',
      columnSn: '',
      vbeln: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
    });
    selection.clearSelection();
    expand.collapseAll();
    fetchPendingColumns(1);
  }, [expand, fetchPendingColumns, selection]);

  // 批量审核
  const handleBatchApprove = useCallback(async () => {
    if (selection.selectedItems.length === 0) {
      toast({
        title: '请选择层析柱',
        description: '请先选择要审核的层析柱',
        variant: 'destructive',
      });
      return;
    }

    setApproving(true);
    const columnSns = [...selection.selectedItems];
    const approveCount = columnSns.length;
    try {
      await columnApi.batchApprove(columnSns);
      fetchPendingColumns(pageNum);
      selection.clearSelection();
      toast({
        title: '批量审核成功',
        description: `${approveCount} 个层析柱已审核通过`,
      });

      if (approveCount > 0) {
        setApprovedColumnSns(columnSns);
        setPostApproveDialogOpen(true);
      }
    } catch (error) {
      console.error('批量审核失败:', error);
      const errorMessage = error instanceof Error ? error.message : '无法完成批量审核';
      toast({
        title: '批量审核失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  }, [fetchPendingColumns, pageNum, selection, toast]);

  // 批量生成报告
  const handleGenerateOnlyAfterApprove = useCallback(async () => {
    if (approvedColumnSns.length === 0) return;
    setGeneratingAfterApprove(true);
    try {
      toast({
        title: '已开始生成报告，请稍后到报告查询页查看',
      });

      // 关闭对话框
      setPostApproveDialogOpen(false);
      // 清空已审核列表
      setApprovedColumnSns([]);

      // 获取已审核列表
      const columnSns = [...approvedColumnSns];
      // 分批
      const batches = chunkArray(columnSns, 20);

      // 提交生成任务
      void (async () => {
        try {
          for (let i = 0; i < batches.length; i += 1) {
            await reportApi.submitGenerateOnlyTask(batches[i]);
          }
        } catch (e) {
          console.error('提交批量生成任务失败:', e);
          const backendMsg = e?.response?.data?.message;
          const errorMessage = backendMsg || (e instanceof Error ? e.message : '无法提交生成任务');
          toast({
            title: '提交生成任务失败',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      })();
    } catch (error) {
      console.error('批量生成失败:', error);
      const backendMsg = error?.response?.data?.message;
      const errorMessage = backendMsg || (error instanceof Error ? error.message : '无法批量生成报告');
      toast({
        title: '批量生成失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      // 重置状态
      setGeneratingAfterApprove(false);
    }
  }, [approvedColumnSns, chunkArray, toast]);

  // 批量生成报告并下载
  const handleGenerateAndDownloadAfterApprove = useCallback(async () => {
    if (approvedColumnSns.length === 0) return;
    // 开始生成
    setGeneratingAfterApprove(true);
    try {
      toast({
        title: '已开始生成压缩包，完成后将自动下载',
      });

      // 关闭对话框
      setPostApproveDialogOpen(false);
      // 清空已审核列表
      setApprovedColumnSns([]);

      // 获取已审核列表
      const columnSns = [...approvedColumnSns];
      // 提交生成任务
      const submitResult = await reportApi.submitGenerateZipTask(columnSns);
      const taskId = submitResult?.taskId;
      if (!taskId) {
        throw new Error('未获取到任务ID');
      }

      void (async () => {
        try {
          const startedAt = Date.now();
          while (true) {
            // 获取任务状态
            const task = await reportApi.getTask(taskId);
            if (task?.status === 'FAILED') {
              throw new Error('任务执行失败');
            }
            if (task?.downloadReady) {
              const response = await reportApi.downloadTaskZip(taskId);
              const blob = new Blob([response.data], { type: 'application/zip' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Reports_AfterApprove_${new Date().getTime()}.zip`);
              document.body.appendChild(link);
              link.click();
              link.parentNode.removeChild(link);
              window.URL.revokeObjectURL(url);

              toast({
                title: '下载开始',
                description: `已开始下载 ${columnSns.length} 个报告的压缩包`,
              });
              break;
            }

            if (Date.now() - startedAt > 15 * 60 * 1000) {
              throw new Error('生成超时，请稍后在报告页确认是否已生成');
            }

            await new Promise((r) => setTimeout(r, 2000));
          }
        } catch (e) {
          console.error('生成并下载任务失败:', e);
          const backendMsg = e?.response?.data?.message;
          const errorMessage = backendMsg || (e instanceof Error ? e.message : '无法生成并下载报告');
          toast({
            title: '生成并下载失败',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      })();
    } catch (error) {
      console.error('批量生成并下载失败:', error);
      const backendMsg = error?.response?.data?.message;
      const errorMessage = backendMsg || (error instanceof Error ? error.message : '无法批量生成并下载报告');
      toast({
        title: '批量生成失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      // 重置状态
      setGeneratingAfterApprove(false);
    }
  }, [approvedColumnSns, toast]);

  // 预览层析柱详情
  const handlePreview = useCallback(
    async (columnSn) => {
      try {
        let column = pendingColumns.find((c) => c.columnSn === columnSn);
        if (!column) return;

        try {
          const standard = await fetchAndCacheStandard(columnSn);
          if (standard) applyStandardToColumns(columnSn, standard);
          column = pendingColumns.find((c) => c.columnSn === columnSn) || column;
        } catch (e) {
          // ignore: preview仍然可以打开，只是标准显示为“-”
        }

        if (column) {
          setViewingColumn(column);
          setShowDetailModal(true);
        }
      } catch (error) {
        console.error('获取层析柱详情失败:', error);
        toast({
          title: '获取详情失败',
          description: '无法加载层析柱详情',
          variant: 'destructive',
        });
      }
    },
    [applyStandardToColumns, fetchAndCacheStandard, pendingColumns, toast]
  );

  // 获取结论标签
  const getConclusionBadge = useCallback(
    (conclusion) => {
      return (
        <ConclusionTag
          value={conclusion === CONCLUSION_STATUS.QUALIFIED ? 'qualified' : 'unqualified'}
        />
      );
    },
    []
  );

  // 返回主页
  const handleBackToMain = () => {
    $w.utils.navigateTo({
      pageId: 'main',
      params: {}
    });
  };

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
                onClick={() => pageNum > 1 && fetchPendingColumns(pageNum - 1)}
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
                    onClick={() => fetchPendingColumns(page)}
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
                onClick={() => pageNum < totalPages && fetchPendingColumns(pageNum + 1)}
                className={
                  pageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [fetchPendingColumns, pageNum, total, totalPages]);

  // 计算统计数据
  const qualifiedCount = useMemo(
    () => pendingColumns.filter((c) => c.finalConclusion === CONCLUSION_STATUS.QUALIFIED).length,
    [pendingColumns]
  );

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPendingColumns(1);
  }, [fetchPendingColumns]);

  return (
    <div style={style} className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToMain}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回主页
            </Button>
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">批量审核签字</h1>
              <p className="text-sm text-gray-500">批量审核待审核的层析柱</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AntdTag label={getUserTypeLabel(currentUser.type)} color="sky" showDot={false} />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 统计概览 */}
        <BatchAuditStats
          totalColumns={pendingColumns.length}
          pendingCount={pendingColumns.length}
          qualifiedCount={qualifiedCount}
        />

        {/* 搜索区域 */}
        <BatchSearchFilters
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        {/* 批量操作 */}
        {selection.selectedItems.length > 0 && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    已选择 {selection.selectedItems.length} 个层析柱
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selection.clearSelection}>
                    取消选择
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchApprove}
                    disabled={approving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    {approving ? '审核中...' : '批量审核通过'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 层析柱列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                待审核层析柱列表
              </span>
              <div className="text-sm text-gray-500">
                当前页显示 {currentColumns.length} 条，共 {filteredColumns.length} 个层析柱
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
              <BatchAuditTable
                columns={currentColumns}
                selectedColumns={selection.selectedItems}
                expandedRows={expand.expandedItems}
                onSelectColumn={(id) => selection.toggleSelection(id)}
                onSelectAll={(checked) =>
                  selection.toggleSelectAll(
                    currentColumns.map((c) => ({ id: c.columnSn })),
                    checked
                  )
                }
                onToggleExpand={handleToggleExpandWithStandard}
                onPreview={handlePreview}
                getConclusionBadge={getConclusionBadge}
              />
            )}
          </CardContent>
        </Card>

        {/* 分页组件 */}
        {filteredColumns.length > 0 && <div className="mt-4">{renderPagination}</div>}

        {/* 空状态 */}
        {!loading && filteredColumns.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待审核层析柱</h3>
              <p className="text-gray-500 mb-4">所有层析柱都已审核完成</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 详情模态框 */}
      {showDetailModal && viewingColumn && (
        <DetailModal
          column={viewingColumn}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setViewingColumn(null);
          }}
        />
      )}
      <Dialog
        open={postApproveDialogOpen}
        onOpenChange={(open) => {
          if (generatingAfterApprove) return;
          setPostApproveDialogOpen(open);
          if (!open) setApprovedColumnSns([]);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>审核已完成</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">
            已审核通过 {approvedColumnSns.length} 个层析柱，是否立即批量生成报告？
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {/* <Button
              variant="outline"
              onClick={() => {
                if (generatingAfterApprove) return;
                setPostApproveDialogOpen(false);
                setApprovedColumnSns([]);
              }}
              disabled={generatingAfterApprove}
            >
              暂不生成
            </Button> */}
            <Button
              variant="outline"
              onClick={handleGenerateOnlyAfterApprove}
              disabled={generatingAfterApprove}
            >
              仅生成
            </Button>
            <Button
              onClick={handleGenerateAndDownloadAfterApprove}
              disabled={generatingAfterApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              生成并下载
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
