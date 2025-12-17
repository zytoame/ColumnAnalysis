import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui';
import { Search, Download, Eye, FileText, User, ArrowLeft, AlertTriangle, Clock, Loader2, FileCheck } from 'lucide-react';
import { EditModal } from '@/components/EditModal';
import { DetailModal } from '@/components/DetailModal';
import { UnqualifiedReportTable } from '@/components/UnqualifiedReportTable';
import { UnqualifiedReportStats } from '@/components/UnqualifiedReportStats';
import { UnqualifiedSearchFilters } from '@/components/UnqualifiedSearchFilters';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { filterData } from '@/utils/filters';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel, getReportTypeLabel } from '@/utils/format';
import { USER_TYPES, REPORT_TYPES, PAGINATION, DATE_RANGES } from '@/constants';

// 简化的模拟不合格层析柱数据
const mockUnqualifiedColumns = [
  {
    id: 'COL-001',
    sapWorkOrderNo: 'WO202501001',
    columnSn: 'COL-2025-001',
    sapOrderNo: 'ORD-202501001',
    deviceSn: 'INST-001',
    reportType: 'glycation',
    status: 'unqualified',
    reportDate: '2025-01-15',
    mode: '糖化模式',
    status: '不合格',
    负责人: '张三',
    审核状态: 'pending',
    不合格原因: '纯度低于标准值',
    generateTime: '2025-01-15 14:30:00',
    // 详细检测数据
    detectionData: {
      moduleTemperature: {
        standard: '25-40°C',
        result: '38.5°C',
        conclusion: 'pass',
        icon: 'Thermometer',
      },
      systemPressure: {
        standard: '5.0-8.0 MPa',
        result: '7.2 MPa',
        conclusion: 'pass',
        icon: 'Gauge',
      },
      hbA1cAppearanceTime: {
        standard: '36-40 秒',
        result: '42.3 秒',
        conclusion: 'fail',
        icon: 'Timer',
      },
      repeatabilityTest: {
        standard: 'CV < 1.5%',
        result: '1.8%',
        conclusion: 'fail',
        icon: 'Activity',
        rawValues: {
          糖化模式: Array.from({ length: 20 }, (_, i) => (35.5 + Math.random() * 0.8).toFixed(2)),
        },
      },
    },
  },
  {
    id: 'COL-002',
    sapWorkOrderNo: 'WO202501002',
    columnSn: 'COL-2025-002',
    sapOrderNo: 'ORD-202501002',
    deviceSn: 'INST-002',
    reportType: 'thalassemia',
    status: 'unqualified',
    reportDate: '2025-01-14',
    mode: '地贫模式',
    status: '不合格',
    负责人: '李四',
    审核状态: 'pending',
    不合格原因: 'pH值超出范围',
    generateTime: '2025-01-14 16:45:00',
    // 详细检测数据
    detectionData: {
      moduleTemperature: {
        standard: '25-40°C',
        result: '35.2°C',
        conclusion: 'pass',
        icon: 'Thermometer',
      },
      systemPressure: {
        standard: '5.0-8.0 MPa',
        result: '6.8 MPa',
        conclusion: 'pass',
        icon: 'Gauge',
      },
      hbA1cAppearanceTime: {
        standard: '36-40 秒',
        result: '38.1 秒',
        conclusion: 'pass',
        icon: 'Timer',
      },
      repeatabilityTest: {
        standard: 'CV < 1.5%',
        result: '2.1%',
        conclusion: 'fail',
        icon: 'Activity',
        rawValues: {
          HbF: Array.from({ length: 10 }, (_, i) => (32.5 + Math.random() * 0.6).toFixed(2)),
          HbA1c: Array.from({ length: 10 }, (_, i) => (35.8 + Math.random() * 0.7).toFixed(2)),
          HbA2: Array.from({ length: 10 }, (_, i) => (2.8 + Math.random() * 0.4).toFixed(2)),
        },
      },
    },
  },
  {
    id: 'COL-003',
    sapWorkOrderNo: 'WO202501003',
    columnSn: 'COL-2025-003',
    sapOrderNo: 'ORD-202501003',
    deviceSn: 'INST-001',
    reportType: 'glycation',
    status: 'unqualified',
    reportDate: '2025-01-13',
    mode: '糖化模式',
    status: '不合格',
    负责人: '王五',
    审核状态: 'pending',
    不合格原因: '杂质含量超标',
    generateTime: '2025-01-13 11:20:00',
    // 详细检测数据
    detectionData: {
      moduleTemperature: {
        standard: '25-40°C',
        result: '32.1°C',
        conclusion: 'pass',
        icon: 'Thermometer',
      },
      systemPressure: {
        standard: '5.0-8.0 MPa',
        result: '5.5 MPa',
        conclusion: 'pass',
        icon: 'Gauge',
      },
      hbA1cAppearanceTime: {
        standard: '36-40 秒',
        result: '39.8 秒',
        conclusion: 'pass',
        icon: 'Timer',
      },
      repeatabilityTest: {
        standard: 'CV < 1.5%',
        result: '1.9%',
        conclusion: 'fail',
        icon: 'Activity',
        rawValues: {
          糖化模式: Array.from({ length: 20 }, (_, i) => (36.2 + Math.random() * 0.9).toFixed(2)),
        },
      },
    },
  },
];

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

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    dateRange: DATE_RANGES.ALL,
  });

  // 使用自定义 hooks
  const { pageNum, setPageNum, pagination, reset: resetPagination } = usePagination(
    filteredColumns,
    { pageSize: PAGINATION.DEFAULT_PAGE_SIZE },
  );
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

  // 当前页数据
  const currentColumns = useMemo(() => pagination.currentItems, [pagination.currentItems]);

  // TODO: 获取不合格层析柱列表
  const fetchUnqualifiedColumns = useCallback(async () => {
    setLoading(true);
    try {
      // 替换为实际的数据源调用

      // 临时使用模拟数据
      setUnqualifiedColumns(mockUnqualifiedColumns);
      setFilteredColumns(mockUnqualifiedColumns);
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
  }, [toast]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // 临时使用前端过滤
      const filtered = filterData(unqualifiedColumns, searchParams);
      setFilteredColumns(filtered);
      resetPagination();
      toast({
        title: '查询完成',
        description: `找到 ${filtered.length} 条不合格层析柱`,
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
  }, [unqualifiedColumns, searchParams, resetPagination, toast]);

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
    setFilteredColumns(unqualifiedColumns);
    resetPagination();
  }, [unqualifiedColumns, resetPagination]);

  // 保存编辑后的层析柱数据
  const handleSaveEdit = useCallback(
    async (updatedColumn) => {
      setSaving(true);
      try {
        // TODO: 替换为实际的数据源调用
        // 临时模拟保存过程
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const updatedColumns = unqualifiedColumns.map((column) =>
          column.id === updatedColumn.id ? updatedColumn : column,
        );
        setUnqualifiedColumns(updatedColumns);
        setFilteredColumns(updatedColumns);
        toast({
          title: '保存成功',
          description: `层析柱 ${updatedColumn.columnSn} 已更新`,
        });
        setShowEditModal(false);
        setEditingColumn(null);
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
    [unqualifiedColumns, toast],
  );

  // 预览层析柱详情
  const handlePreview = useCallback(
    (columnId) => {
      try {
        // TODO: 替换为实际的数据源调用
        const column = unqualifiedColumns.find((c) => c.id === columnId);
        if (column) {
          const detailColumn = {
            ...column,
            columnSerial: column.columnSn,
            columnName: `${column.检测项目}层析柱`,
            testType: column.检测项目,
            testDate: column.reportDate,
            operator: column.负责人,
            finalConclusion: 'unqualified',
            operationHistory: [
              {
                time: column.generateTime,
                operator: column.负责人,
                action: '提交检测',
                remark: `完成${column.检测项目}，发现${column.不合格原因}`,
              },
            ],
          };
          setViewingColumn(detailColumn);
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
    [unqualifiedColumns, toast],
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
    if (pagination.totalPages <= 1) return null;
    const pageNumbers = generatePageNumbers(pageNum, pagination.totalPages);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          显示第 {pagination.startIndex + 1} - {Math.min(pagination.endIndex, filteredColumns.length)} 条，共{' '}
          {filteredColumns.length} 条记录
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPageNum((prev) => Math.max(prev - 1, 1))}
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
                    onClick={() => setPageNum(page)}
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
                onClick={() => setPageNum((prev) => Math.min(prev + 1, pagination.totalPages))}
                className={
                  pageNum === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }, [pageNum, pagination, filteredColumns.length, setPageNum]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchUnqualifiedColumns();
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
                onSelectReport={selection.toggleSelection}
                onSelectAll={(checked) => selection.toggleSelectAll(currentColumns, checked)}
                onToggleExpand={expand.toggleExpand}
                onEdit={(columnId) => {
                  const column = unqualifiedColumns.find((c) => c.id === columnId);
                  if (column) {
                    setEditingColumn({
                      ...column,
                      detectionData: JSON.parse(JSON.stringify(column.detectionData)),
                    });
                    setShowEditModal(true);
                  }
                }}
                onPreview={handlePreview}
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
