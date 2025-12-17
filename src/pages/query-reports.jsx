import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui';
import { FileText, ArrowLeft, Plus, Search, Download, Loader2, User, Thermometer, Gauge, Timer, Activity, Package } from 'lucide-react';
import { ReportTable } from '@/components/ReportTable';
import { ReportStats } from '@/components/ReportStats';
import { SearchFilters } from '@/components/SearchFilters';
import { DetailModal } from '@/components/DetailModal';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import { filterData } from '@/utils/filters';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, TEST_TYPES, PAGINATION, TEST_RESULTS } from '@/constants';

// 简化的模拟报告数据
const mockReports = [{
  id: 'RPT-001',
  sapWorkOrderNo: 'WO202501001',
  columnSn: 'COL-2025-001',
  sapOrderNo: 'ORD-202501001',
  deviceSn: 'INST-001',
  columnName: 'Protein A Column',
  mode: '糖化模式',
  testDate: '2025-01-15',
  status: '合格',
  operator: '张三',
  submitTime: '2025-01-15 14:30:00',
  // 详细检测数据
  detectionData: {
    setTemperature: {
      standard: '25-40°C',
      result: '38.5°C',
      conclusion: 'pass',
      icon: Thermometer
    },
    pressure: {
      standard: '5.0-8.0 MPa',
      result: '7.2 MPa',
      conclusion: 'pass',
      icon: Gauge
    },
    peakTime: {
      standard: '36-40 秒',
      result: '42.3 秒',
      conclusion: 'fail',
      icon: Timer
    },
    repeatabilityTest: {
      standard: 'CV < 1.5%',
      result: '1.8%',
      conclusion: 'fail',
      icon: Activity
    },
    appearanceInspection: {
      standard: '包装完整，无明显损坏',
      result: '包装完好',
      conclusion: 'pass',
      icon: Package
    }
  },
  finalConclusion: 'qualified',
  // 操作历史
  operationHistory: [{
    time: '2025-01-15 14:30:00',
    operator: '张三',
    action: '提交检测',
    remark: '完成所有检测项目'
  }, {
    time: '2025-01-15 15:00:00',
    operator: '系统',
    action: '自动判定',
    remark: '检测结果显示合格'
  }]
}, {
  id: 'RPT-002',
  sapWorkOrderNo: 'WO202501002',
  columnSn: 'COL-2025-002',
  sapOrderNo: 'ORD-202501002',
  deviceSn: 'INST-002',
  columnName: 'Ion Exchange Column',
  mode: '地贫模式',
  testDate: '2025-01-14',
  status: '合格',
  operator: '李四',
  submitTime: '2025-01-14 16:45:00',
  // 详细检测数据
  detectionData: {
    setTemperature: {
      standard: '25-40°C',
      result: '35.2°C',
      conclusion: 'pass',
      icon: Thermometer
    },
    pressure: {
      standard: '5.0-8.0 MPa',
      result: '6.8 MPa',
      conclusion: 'pass',
      icon: Gauge
    },
    peakTime: {
      standard: '36-40 秒',
      result: '38.1 秒',
      conclusion: 'pass',
      icon: Timer
    },
    repeatabilityTest: {
      standard: 'CV < 1.5%',
      result: '1.2%',
      conclusion: 'pass',
      icon: Activity
    },
    appearanceInspection: {
      standard: '包装完整，无明显损坏',
      result: '包装完好',
      conclusion: 'pass',
      icon: Package
    }
  },
  finalConclusion: 'qualified',
  operationHistory: [{
    time: '2025-01-14 16:45:00',
    operator: '李四',
    action: '提交检测',
    remark: '完成地贫模式检测'
  }]
}, {
  id: 'RPT-003',
  sapWorkOrderNo: 'WO202501003',
  columnSn: 'COL-2025-003',
  sapOrderNo: 'ORD-202501003',
  deviceSn: 'INST-001',
  columnName: 'Gel Filtration Column',
  mode: '糖化模式',
  testDate: '2025-01-13',
  status: '不合格',
  operator: '王五',
  submitTime: '2025-01-13 11:20:00',
  // 详细检测数据
  detectionData: {
    setTemperature: {
      standard: '25-40°C',
      result: '32.1°C',
      conclusion: 'pass',
      icon: Thermometer
    },
    pressure: {
      standard: '5.0-8.0 MPa',
      result: '5.5 MPa',
      conclusion: 'pass',
      icon: Gauge
    },
    peakTime: {
      standard: '36-40 秒',
      result: '39.8 秒',
      conclusion: 'pass',
      icon: Timer
    },
    repeatabilityTest: {
      standard: 'CV < 1.5%',
      result: '2.1%',
      conclusion: 'fail',
      icon: Activity
    },
    appearanceInspection: {
      standard: '包装完整，无明显损坏',
      result: '密封塞松动',
      conclusion: 'fail',
      icon: Package
    }
  },
  finalConclusion: 'unqualified',
  operationHistory: [{
    time: '2025-01-13 11:20:00',
    operator: '王五',
    action: '提交检测',
    remark: '完成糖化模式检测'
  }]
}, {
  id: 'RPT-004',
  sapWorkOrderNo: 'WO202501004',
  columnSn: 'COL-2025-004',
  sapOrderNo: 'ORD-202501004',
  deviceSn: 'INST-002',
  columnName: 'Affinity Column',
  mode: '地贫模式',
  testDate: '2025-01-12',
  status: '合格',
  operator: '赵六',
  submitTime: '2025-01-12 09:15:00',
  // 详细检测数据
  detectionData: {
    setTemperature: {
      standard: '25-40°C',
      result: '37.8°C',
      conclusion: 'pass',
      icon: Thermometer
    },
    pressure: {
      standard: '5.0-8.0 MPa',
      result: '6.2 MPa',
      conclusion: 'pass',
      icon: Gauge
    },
    peakTime: {
      standard: '36-40 秒',
      result: '37.5 秒',
      conclusion: 'pass',
      icon: Timer
    },
    repeatabilityTest: {
      standard: 'CV < 1.5%',
      result: '0.9%',
      conclusion: 'pass',
      icon: Activity
    },
    appearanceInspection: {
      standard: '包装完整，无明显损坏',
      result: '包装完好',
      conclusion: 'pass',
      icon: Package
    }
  },
  finalConclusion: 'qualified',
  operationHistory: [{
    time: '2025-01-12 09:15:00',
    operator: '赵六',
    action: '提交检测',
    remark: '完成地贫模式检测'
  }]
}];
export default function QueryReportsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  // 状态管理
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    status: TEST_RESULTS.ALL,
  });

  // 使用自定义 hooks
  const { pageNum, setPageNum, pagination, reset: resetPagination } = usePagination(
    filteredReports,
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
  const currentReports = useMemo(() => pagination.currentItems, [pagination.currentItems]);

  // 获取报告列表
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // const result = await $w?.cloud.callDataSource({
      //   dataSourceName: 'chromatography_reports',
      //   methodName: 'wedaGetRecordsV2',
      //   params: {
      //     filter: {
      //       where: {
      //         $and: [
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
      // setReports(result.records);
      // setFilteredReports(result.records);

      // 临时使用模拟数据
      setReports(mockReports);
      setFilteredReports(mockReports);
    } catch (error) {
      console.error('获取报告失败:', error);
      toast({
        title: '获取数据失败',
        description: '无法加载报告列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [$w, toast]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    setLoading(true);
    try {
      // TODO: 替换为实际的数据源调用
      // 临时使用前端过滤
      const filtered = filterData(reports, searchParams);
      setFilteredReports(filtered);
      resetPagination();
      toast({
        title: '查询完成',
        description: `找到 ${filtered.length} 条报告`,
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
  }, [reports, searchParams, resetPagination, toast]);

  // 重置搜索
  const handleReset = useCallback(() => {
    setSearchParams({
      sapWorkOrderNo: '',
      columnSn: '',
      sapOrderNo: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
      status: TEST_RESULTS.ALL,
    });
    setFilteredReports(reports);
    resetPagination();
  }, [reports, resetPagination]);

  // 生成报告
  const handleGenerateReport = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'generate-report',
      params: {},
    });
  }, [$w]);

  // 下载报告
  const handleDownload = useCallback(
    async (reportId) => {
      try {
        // TODO: 替换为实际的数据源调用
        // 临时模拟下载
        const report = reports.find((r) => r.id === reportId);
        if (report) {
          toast({
            title: '下载成功',
            description: `报告 ${report.id} 已开始下载`,
          });
        }
      } catch (error) {
        console.error('下载失败:', error);
        const errorMessage = error instanceof Error ? error.message : '无法下载报告';
        toast({
          title: '下载失败',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [reports, toast]
  );

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
      // TODO: 替换为实际的数据源调用
      // 临时模拟批量下载
      toast({
        title: '批量下载开始',
        description: `${selection.selectedItems.length} 个报告已开始下载`,
      });
      selection.clearSelection();
    } catch (error) {
      console.error('批量下载失败:', error);
      const errorMessage = error instanceof Error ? error.message : '无法批量下载报告';
      toast({
        title: '批量下载失败',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [selection, toast]);

  // 预览报告详情
  const handlePreview = useCallback(
    (reportId) => {
      try {
        // TODO: 替换为实际的数据源调用
        const report = reports.find((r) => r.id === reportId);
        if (report) {
          setViewingReport(report);
          setShowDetailModal(true);
        }
      } catch (error) {
        console.error('获取报告详情失败:', error);
        toast({
          title: '获取详情失败',
          description: '无法加载报告详情',
          variant: 'destructive',
        });
      }
    },
    [reports, toast]
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
          显示第 {pagination.startIndex + 1} - {Math.min(pagination.endIndex, filteredReports.length)} 条，共{' '}
          {filteredReports.length} 条记录
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
  }, [pageNum, pagination, filteredReports.length, setPageNum]);

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
    fetchReports();
  }, [fetchReports]);
  return <div style={style} className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBackToMain} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回主页
            </Button>
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">报告查询</h1>
              <p className="text-sm text-gray-500">查询和管理层析柱检测报告</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <User className="w-3 h-3 mr-1" />
              {getUserTypeLabel(currentUser.type)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 统计概览 */}
        <ReportStats totalReports={reports.length} qualifiedCount={qualifiedCount} unqualifiedCount={unqualifiedCount} todayReports={todayReports} />

        {/* 搜索区域 */}
        <SearchFilters searchParams={searchParams} setSearchParams={setSearchParams} onSearch={handleSearch} onReset={handleReset} loading={loading} />

        {/* 批量操作 */}
        {selection.selectedItems.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    已选择 {selection.selectedItems.length} 个报告
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selection.clearSelection}>
                    取消选择
                  </Button>
                  <Button size="sm" onClick={handleBatchDownload} className="bg-blue-600 hover:bg-blue-700">
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
                <Button size="sm" onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  生成报告
                </Button>
                <div className="text-sm text-gray-500">
                  当前页显示 {currentReports.length} 条，共 {filteredReports.length} 个报告
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
                expandedRows={expand.expandedItems}
                onSelectReport={selection.toggleSelection}
                onSelectAll={(checked) => selection.toggleSelectAll(currentReports, checked)}
                onToggleExpand={expand.toggleExpand}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            )}
          </CardContent>
        </Card>

        {/* 分页组件 */}
        {filteredReports.length > 0 && <div className="mt-4">{renderPagination}</div>}

        {/* 空状态 */}
        {!loading && filteredReports.length === 0 && <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无报告</h3>
              <p className="text-gray-500 mb-4">还没有生成任何检测报告</p>
              <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                生成第一个报告
              </Button>
            </CardContent>
          </Card>}
      </div>

      {/* 详情模态框 */}
      {showDetailModal && viewingReport && <DetailModal report={viewingReport} isOpen={showDetailModal} onClose={() => {
      setShowDetailModal(false);
      setViewingReport(null);
    }} />}
    </div>;
}