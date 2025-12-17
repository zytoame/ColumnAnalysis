import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui';
import { CheckCircle, ArrowLeft, PenTool, XCircle, Loader2, FileCheck, User, Thermometer, Gauge, Timer, Activity, Package } from 'lucide-react';
import { BatchAuditTable } from '@/components/BatchAuditTable';
import { BatchAuditStats } from '@/components/BatchAuditStats';
import { BatchSearchFilters } from '@/components/BatchSearchFilters';
import { DetailModal } from '@/components/DetailModal';
import { SignaturePad } from '@/components/SignaturePad';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import { filterData } from '@/utils/filters';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, TEST_TYPES, PAGINATION, CONCLUSION_STATUS } from '@/constants';

// 模拟数据（后续应移到单独文件）
const mockPendingColumns = [
  {
    id: 'COL-001',
    sapWorkOrderNo: 'WO202501001',
    columnSn: 'COL-2025-001',
    sapOrderNo: 'ORD-202501001',
    deviceSn: 'INST-001',
    columnName: 'Protein A Column',
    mode: TEST_TYPES.GLYCATION,
    testDate: '2025-01-15',
    status: '合格',
    operator: '张三',
    submitTime: '2025-01-15 14:30:00',
    detectionData: {
      setTemperature: {
        standard: '25-40°C',
        result: '38.5°C',
        conclusion: 'pass',
        icon: Thermometer,
      },
      pressure: {
        standard: '5.0-8.0 MPa',
        result: '7.2 MPa',
        conclusion: 'pass',
        icon: Gauge,
      },
      peakTime: {
        standard: '36-40 秒',
        result: '40 秒',
        conclusion: 'pass',
        icon: Timer,
      },
      repeatabilityTest: {
        standard: 'CV < 1.5%',
        result: '1.4%',
        conclusion: 'pass',
        icon: Activity,
      },
      appearanceInspection: {
        standard: '包装完整，无明显损坏',
        result: '包装完整，无明显损坏',
        conclusion: 'pass',
        icon: Package,
      },
    },
    finalConclusion: CONCLUSION_STATUS.UNQUALIFIED,
    operationHistory: [
      {
        time: '2025-01-15 14:30:00',
        operator: '张三',
        action: '提交检测',
        remark: '完成所有检测项目',
      },
      {
        time: '2025-01-15 15:00:00',
        operator: '系统',
        action: '自动判定',
        remark: '检测结果显示合格',
      },
    ],
  },
  {
    id: 'COL-002',
    sapWorkOrderNo: 'WO202501002',
    columnSn: 'COL-2025-002',
    sapOrderNo: 'ORD-202501002',
    deviceSn: 'INST-002',
    columnName: 'Ion Exchange Column',
    mode: TEST_TYPES.THALASSEMIA,
    testDate: '2025-01-14',
    status: '合格',
    operator: '李四',
    submitTime: '2025-01-14 16:45:00',
    detectionData: {
      setTemperature: {
        standard: '25-40°C',
        result: '35.2°C',
        conclusion: 'pass',
        icon: Thermometer,
      },
      pressure: {
        standard: '5.0-8.0 MPa',
        result: '6.8 MPa',
        conclusion: 'pass',
        icon: Gauge,
      },
      peakTime: {
        standard: '36-40 秒',
        result: '38.1 秒',
        conclusion: 'pass',
        icon: Timer,
      },
      repeatabilityTest: {
        standard: 'CV < 1.5%',
        result: '1.2%',
        conclusion: 'pass',
        icon: Activity,
      },
      appearanceInspection: {
        standard: '包装完整，无明显损坏',
        result: '包装完好',
        conclusion: 'pass',
        icon: Package,
      },
    },
    finalConclusion: CONCLUSION_STATUS.QUALIFIED,
    operationHistory: [
      {
        time: '2025-01-14 16:45:00',
        operator: '李四',
        action: '提交检测',
        remark: '完成地贫模式检测',
      },
    ],
  },
];

export default function BatchAuditPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 状态管理
  const [pendingColumns, setPendingColumns] = useState([]);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingColumn, setViewingColumn] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(false);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
  });

  // 使用自定义 hooks
  const { pageNum, setPageNum, pagination, reset: resetPagination } = usePagination(
    filteredColumns,
    { pageSize: PAGINATION.DEFAULT_PAGE_SIZE }
  );
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

  // 当前页数据
  const currentColumns = useMemo(() => pagination.currentItems, [pagination.currentItems]);

  // TODO: 从后端获取待审核层析柱列表
  // 需要调用接口获取所有待审核的层析柱
  const fetchPendingColumns = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // const result = await $w?.cloud.callDataSource({
      //   dataSourceName: 'chromatography_columns',
      //   methodName: 'wedaGetRecordsV2',
      //   params: {
      //     filter: {
      //       where: {
      //         $and: [
      //           { auditStatus: { $eq: 'pending' } },
      //           { createBy: { $eq-current-user: true } }
      //         ]
      //       }
      //     },
      //     orderBy: [{ submitTime: 'desc' }],
      //     select: { $master: true },
      //     getCount: true,
      //     pageSize: PAGINATION.MAX_PAGE_SIZE
      //   }
      // });
      // setPendingColumns(result.records);
      // setFilteredColumns(result.records);

      // 临时使用模拟数据
      setPendingColumns(mockPendingColumns);
      setFilteredColumns(mockPendingColumns);
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
  }, [$w, toast]);

  // TODO: 根据搜索条件过滤层析柱
  // 需要调用后端接口进行高级搜索
  const handleSearch = useCallback(() => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // const filterConditions = {
      //   $and: [
      //     { auditStatus: { $eq: 'pending' } }
      //   ]
      // };

      // if (searchParams.workOrder) {
      //   filterConditions.$and.push({ workOrder: { $eq: searchParams.workOrder } });
      // }
      // if (searchParams.columnSn) {
      //   filterConditions.$and.push({ columnSn: { $eq: searchParams.columnSn } });
      // }
      // if (searchParams.orderNumber) {
      //   filterConditions.$and.push({ orderNumber: { $eq: searchParams.orderNumber } });
      // }
      // if (searchParams.instrumentSerial) {
      //   filterConditions.$and.push({ instrumentSerial: { $eq: searchParams.instrumentSerial } });
      // }
      // if (searchParams.testType !== 'all') {
      //   filterConditions.$and.push({ testType: { $eq: searchParams.testType } });
      // }

      // const result = await $w.cloud.callDataSource({
      //   dataSourceName: 'chromatography_columns',
      //   methodName: 'wedaGetRecordsV2',
      //   params: {
      //     filter: { where: filterConditions },
      //     orderBy: [{ submitTime: 'desc' }],
      //     select: { $master: true },
      //     getCount: true,
      //     pageSize: 200
      //   }
      // });
      // setFilteredColumns(result.records);

      // 临时使用前端过滤
      const filtered = filterData(pendingColumns, searchParams);
      setFilteredColumns(filtered);
      resetPagination();
      toast({
        title: '查询完成',
        description: `找到 ${filtered.length} 条待审核层析柱`,
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
  }, [pendingColumns, searchParams, resetPagination, toast]);

  // 重置搜索
  const handleReset = useCallback(() => {
    setSearchParams({
      sapWorkOrderNo: '',
      columnSn: '',
      sapOrderNo: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
    });
    setFilteredColumns(pendingColumns);
    resetPagination();
  }, [pendingColumns, resetPagination]);

  // TODO: 批量审核通过
  // 需要调用后端接口批量更新审核状态
  const handleBatchApprove = useCallback(() => {
    if (selection.selectedItems.length === 0) {
      toast({
        title: '请选择层析柱',
        description: '请先选择要审核的层析柱',
        variant: 'destructive',
      });
      return;
    }
    setShowSignatureModal(true);
  }, [selection.selectedItems.length, toast]);

  // 确认批量审核
  const handleConfirmBatchApprove = useCallback(
    async (signatureData) => {
      setSigning(true);
      try {
        // TODO: 替换为实际的数据源调用
        // 临时模拟审核过程
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const updatedColumns = pendingColumns.filter(
          (column) => !selection.selectedItems.includes(column.id)
        );
        setPendingColumns(updatedColumns);
        setFilteredColumns(updatedColumns);
        selection.clearSelection();
        setShowSignatureModal(false);
        toast({
          title: '批量审核成功',
          description: `${selection.selectedItems.length} 个层析柱已审核通过`,
        });
      } catch (error) {
        console.error('批量审核失败:', error);
        const errorMessage = error instanceof Error ? error.message : '无法完成批量审核';
        toast({
          title: '批量审核失败',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setSigning(false);
      }
    },
    [pendingColumns, selection, toast]
  );

  // 预览层析柱详情
  const handlePreview = useCallback(
    (columnId) => {
      try {
        // TODO: 替换为实际的数据源调用
        const column = pendingColumns.find((c) => c.id === columnId);
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
    [pendingColumns, toast]
  );

  // 展开/收起行
  const handleToggleExpand = columnId => {
    if (expandedRows.includes(columnId)) {
      setExpandedRows(expandedRows.filter(id => id !== columnId));
    } else {
      setExpandedRows([...expandedRows, columnId]);
    }
  };

  // 获取结论标签
  const getConclusionBadge = useCallback(
    (conclusion) => {
      return conclusion === CONCLUSION_STATUS.QUALIFIED ? (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          合格
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          不合格
        </Badge>
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

  // 计算统计数据
  const qualifiedCount = useMemo(
    () => pendingColumns.filter((c) => c.finalConclusion === CONCLUSION_STATUS.QUALIFIED).length,
    [pendingColumns]
  );

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPendingColumns();
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
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <User className="w-3 h-3 mr-1" />
              {getUserTypeLabel(currentUser.type)}
            </Badge>
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
                  <Button size="sm" onClick={handleBatchApprove} className="bg-green-600 hover:bg-green-700">
                    <PenTool className="w-4 h-4 mr-2" />
                    批量审核通过
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
                onSelectColumn={selection.toggleSelection}
                onSelectAll={(checked) => selection.toggleSelectAll(currentColumns, checked)}
                onToggleExpand={expand.toggleExpand}
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

      {/* 签名模态框 */}
      {showSignatureModal && (
        <SignaturePad
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
          }}
          onConfirm={handleConfirmBatchApprove}
          signing={signing}
        />
      )}
    </div>
  );
}
