import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui';
import { User, ArrowLeft, AlertTriangle, Clock, Loader2, FileCheck } from 'lucide-react';
import { EditModal } from '@/components/EditModal';
import { DetailModal } from '@/components/DetailModal';
import { UnqualifiedReportTable } from '@/components/UnqualifiedReportTable';
import { UnqualifiedReportStats } from '@/components/UnqualifiedReportStats';
import { UnqualifiedSearchFilters } from '@/components/UnqualifiedSearchFilters';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, PAGINATION, DATE_RANGES, TEST_TYPES, CONCLUSION_STATUS } from '@/constants';
import columnApi from '@/api/column';

export default function UnqualifiedReportsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 状态管理
  const [unqualifiedColumns, setUnqualifiedColumns] = useState([]);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingColumn, setViewingColumn] = useState(null);
  const [loading, setLoading] = useState(false);

  const [standardCache, setStandardCache] = useState({});

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    dateRange: DATE_RANGES.ALL,
  });
  const selection = useSelection();
  const expand = useExpand();

  // 当前用户信息
  const currentUser = useMemo(
    () => ({
      name: '管理员',
      type: USER_TYPES.ADMIN,
    }),
    [],
  );

  const currentColumns = useMemo(() => filteredColumns, [filteredColumns]);

  const parseNumber = useCallback((v) => {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const num = parseFloat(String(v).replace(/[^0-9.+-]/g, ''));
    return Number.isFinite(num) ? num : null;
  }, []);

  const mapColumnToUi = useCallback((c) => {
    return {
      ...c,
      id: c?.columnSn,
      finalConclusion: CONCLUSION_STATUS.UNQUALIFIED,
      testResult: '不合格',
      testType: c?.mode,
      workOrder: c?.sapWorkOrderNo,
      orderNumber: c?.sapOrderNo,
      instrumentSerial: c?.deviceSn,
      testDate: c?.inspectionDate,
      submitTime: c?.createdAt,
      operator: c?.auditor,
      detectionData: {
        setTemperature: {
          standard: '-',
          result: c?.setTemperature != null ? `${c.setTemperature}` : '-',
          conclusion: 'fail',
          icon: 'Thermometer',
        },
        pressure: {
          standard: '-',
          result: c?.pressure != null ? `${c.pressure}` : '-',
          conclusion: 'fail',
          icon: 'Gauge',
        },
        peakTime: {
          standard: '-',
          result: c?.peakTime != null ? `${c.peakTime}` : '-',
          conclusion: 'fail',
          icon: 'Timer',
        },
        repeatabilityTest: {
          standard: '-',
          result: c?.cvValue != null ? `${c.cvValue}%` : '-',
          conclusion: 'fail',
          icon: 'Activity',
          rawValues: {},
        },
      },
    };
  }, []);

  const formatRange = useCallback((min, max) => {
    const minV = min == null ? null : `${min}`;
    const maxV = max == null ? null : `${max}`;
    if (minV == null && maxV == null) return '-';
    if (minV != null && maxV != null) return `${minV} ~ ${maxV}`;
    if (minV != null) return `>= ${minV}`;
    return `<= ${maxV}`;
  }, []);

  const applyStandardToReports = useCallback((columnSn, standard) => {
    const standardText = {
      setTemperature: formatRange(standard?.minTemperature, standard?.maxTemperature),
      pressure: formatRange(standard?.minPressure, standard?.maxPressure),
      peakTime: formatRange(standard?.minPeakTime, standard?.maxPeakTime),
      repeatabilityTest: standard?.maxCv != null ? `<= ${standard.maxCv}%` : '-',
    };

    const patchOne = (report) => {
      if (report?.columnSn !== columnSn) return report;
      const d = report?.detectionData || {};
      return {
        ...report,
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

    setUnqualifiedColumns((prev) => prev.map(patchOne));
    setFilteredColumns((prev) => prev.map(patchOne));
  }, [formatRange]);

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

  const handleToggleExpandWithStandard = useCallback(async (columnSn) => {
    const isExpanded = expand.expandedItems.includes(columnSn);
    if (isExpanded) {
      expand.toggleExpand(columnSn);
      return;
    }

    try {
      const standard = await fetchAndCacheStandard(columnSn);
      if (standard) applyStandardToReports(columnSn, standard);
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
  }, [applyStandardToReports, expand, fetchAndCacheStandard, toast]);

  const fetchUnqualifiedColumns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await columnApi.getUnqualifiedColumns(page, PAGINATION.DEFAULT_PAGE_SIZE);
      const data = response?.data || {};
      const records = (data.records || []).map(mapColumnToUi);
      setUnqualifiedColumns(records);
      setFilteredColumns(records);
      setPageNum(page);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 0);
    } catch (error) {
      console.error('获取不合格层析柱失败:', error);
      toast({
        title: '获取数据失败',
        description: '无法加载不合格层析柱列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [mapColumnToUi, toast]);

  // 搜索处理
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        status: '不合格',
        mode: searchParams.mode === TEST_TYPES.ALL ? '' : searchParams.mode,
      };
      const response = await columnApi.advancedSearch(params, 1, PAGINATION.DEFAULT_PAGE_SIZE);
      const records = (response.records || []).map(mapColumnToUi);
      setFilteredColumns(records);
      setUnqualifiedColumns(records);
      setPageNum(1);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 0);
      toast({
        title: '查询完成',
        description: `找到 ${response.total || 0} 条不合格层析柱`,
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
      sapWorkOrderNo: '',
      columnSn: '',
      sapOrderNo: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
      dateRange: DATE_RANGES.ALL,
    });
    selection.clearSelection();
    expand.collapseAll();
    fetchUnqualifiedColumns(1);
  }, [expand, fetchUnqualifiedColumns, selection]);

  // 保存编辑后的层析柱数据
  const handleSaveEdit = useCallback(
    async (updatedColumn) => {
      setSaving(true);
      try {
        const req = {
          columnSn: updatedColumn.columnSn,
          setTemperature: parseNumber(updatedColumn?.detectionData?.setTemperature?.result),
          pressure: parseNumber(updatedColumn?.detectionData?.pressure?.result),
          peakTime: parseNumber(updatedColumn?.detectionData?.peakTime?.result),
          cvValue: parseNumber(updatedColumn?.detectionData?.repeatabilityTest?.result),
          changeLogs: Array.isArray(updatedColumn?.changeLogs) ? updatedColumn.changeLogs : [],
          repeatabilityData: (() => {
            const raw = updatedColumn?.detectionData?.repeatabilityTest?.rawValues || {};
            const converted = {};
            Object.entries(raw).forEach(([k, arr]) => {
              if (!Array.isArray(arr)) return;
              const nums = arr
                .map((x) => parseNumber(x))
                .filter((x) => x != null);
              if (nums.length > 0) converted[k] = nums;
            });
            return Object.keys(converted).length > 0 ? converted : null;
          })(),
        };

        await columnApi.updateColumnData(req);

        toast({
          title: '保存成功',
          description: `层析柱 ${updatedColumn.columnSn} 已更新`,
        });
        setShowEditModal(false);
        setEditingColumn(null);

        fetchUnqualifiedColumns(pageNum);
      } catch (error) {
        console.error('保存失败:', error);
        const errorMessage = error instanceof Error ? error.message : '无法保存层析柱更改';
        toast({
          title: '保存失败',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [fetchUnqualifiedColumns, pageNum, parseNumber, toast],
  );

  // 返回主页
  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {},
    });
  }, [$w]);

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
                onClick={() => pageNum > 1 && fetchUnqualifiedColumns(pageNum - 1)}
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
                    onClick={() => fetchUnqualifiedColumns(page)}
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
                onClick={() => pageNum < totalPages && fetchUnqualifiedColumns(pageNum + 1)}
                className={
                  pageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [fetchUnqualifiedColumns, pageNum, total, totalPages]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchUnqualifiedColumns(1);
  }, [fetchUnqualifiedColumns]);

  // 统计概览数据
  const stats = useMemo(() => {
    const total = unqualifiedColumns.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = unqualifiedColumns.filter((c) =>
      (c.generateTime || c.submitTime || '').startsWith(today),
    ).length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = unqualifiedColumns.filter((c) => {
      const timeStr = c.generateTime || c.submitTime;
      if (!timeStr) return false;
      const date = new Date(timeStr.replace(/-/g, '/'));
      const time = date.getTime();
      if (Number.isNaN(time)) return false;
      return date >= weekAgo && date <= now;
    }).length;

    return { total, todayCount, weekCount };
  }, [unqualifiedColumns]);

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
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">不合格层析柱管理</h1>
              <p className="text-sm text-gray-500">查看和编辑不合格层析柱检测数据</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <User className="w-3 h-3 mr-1" />
              {getUserTypeLabel(currentUser.type)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 统计概览：复用 UnqualifiedReportStats */}
        <UnqualifiedReportStats
          totalReports={stats.total}
          todayReports={stats.todayCount}
          thisWeekReports={stats.weekCount}
        />

        {/* 搜索区域：复用 UnqualifiedSearchFilters（仍可使用额外的 reportType / dateRange 条件） */}
        <UnqualifiedSearchFilters
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        {/* 批量操作 */}
        {selection.selectedItems.length > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    已选择 {selection.selectedItems.length} 个层析柱
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selection.clearSelection}>
                    取消选择
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
                <AlertTriangle className="w-5 h-5" />
                不合格层析柱列表
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
              <UnqualifiedReportTable
                reports={currentColumns}
                selectedReports={selection.selectedItems}
                expandedRows={expand.expandedItems}
                onSelectReport={(id) => selection.toggleSelection(id)}
                onSelectAll={(checked) =>
                  selection.toggleSelectAll(
                    currentColumns.map((c) => ({ id: c.columnSn })),
                    checked
                  )
                }
                onToggleExpand={handleToggleExpandWithStandard}
                onEdit={(columnSn) => {
                  const column = unqualifiedColumns.find((c) => c.columnSn === columnSn);
                  if (column) {
                    setEditingColumn({
                      ...column,
                      detectionData: JSON.parse(JSON.stringify(column.detectionData)),
                    });
                    setShowEditModal(true);
                  }
                }}
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
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无不合格层析柱</h3>
              <p className="text-gray-500 mb-4">请调整查询条件或等待新的检测数据</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 编辑模态框 */}
      {showEditModal && editingColumn && (
        <EditModal
          report={editingColumn}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingColumn(null);
          }}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}

      {/* 详情模态框 */}
      {showDetailModal && viewingColumn && (
        <DetailModal
          report={viewingColumn}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setViewingColumn(null);
          }}
        />
      )}
    </div>
  );
}
