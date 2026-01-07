import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, useToast,
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
  Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { FileText, ArrowLeft, Plus, Search, Download, Loader2, User } from 'lucide-react';
import { AntdTag } from '@/components/AntdTag.jsx';
import { ReportTable } from '@/components/ReportTable';
import { ReportStats } from '@/components/ReportStats';
import { SearchFilters } from '@/components/SearchFilters';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useExpand } from '@/hooks/useExpand';
import reportApi from '@/api/report';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, TEST_TYPES, PAGINATION, TEST_RESULTS } from '@/constants';


export default function QueryReportsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

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
    columnSn: '',  // 层析柱序列号
    GI_VBELN: '',  // 订单号
    GI_RSNUM: '',  // 预留单号
    GI_ZDH: '',    // 非生产领料单号
    GI_ZBHLS: '',  // 备货单号
    reportType: 'all', // 报告类型（CN/EN）
    mode: TEST_TYPES.ALL, // 检验类型
    status: 'all', // 报告状态：all(全部), GENERATED(已生成), DOWNLOADED(已下载)
  });

  // --- hooks ---
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
      const response = await reportApi.searchReports(
        req,
        page,
        PAGINATION.DEFAULT_PAGE_SIZE
      );

      // MyBatis-Plus Page 对象序列化后的字段：records, total, pages, current, size
      //更新数据
      setReports(response.records || []);
      setTotal(response.total || 0);
      setPageNum(page);
      setTotalPages(response.pages || Math.ceil((response.total || 0) / PAGINATION.DEFAULT_PAGE_SIZE));
    
      return response;
    } catch (error) {
      console.error('获取报告失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      toast({
        title: '获取数据失败',
        description: error.response?.data?.message || error.message || '无法加载报告列表',
        variant: 'destructive',
      });
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
      console.error('搜索失败:', error);
      toast({
        title: '搜索失败',
        description: '无法执行搜索操作',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, fetchReports, toast]);

  // 重置搜索
  const handleReset = () => {
    const resetValues = {
      GI_AUFNR: '',
      columnSn: '',
      GI_VBELN: '',
      GI_RSNUM: '',  // 预留单号
      GI_ZDH: '',    // 非生产领料单号
      GI_ZBHLS: '',  // 备货单号
      reportType: 'all', // 报告类型（CN/EN）
      mode: TEST_TYPES.ALL,
      status: 'all', // 报告状态：all(全部), GENERATED(已生成), DOWNLOADED(已下载)
    };
    setSearchParams(resetValues);
    fetchReports(1, resetValues);
  };

  // 下载报告
  const handleDownload = useCallback( async (report) => {
      try {
        const columnSn = typeof report === 'string' ? report : report?.columnSn;
        if (!columnSn) {
          throw new Error('缺少报告编号');
        }
        const response = await reportApi.downloadReport(columnSn);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url;
        link.download = `Report_${columnSn}.pdf`;
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
        console.error('下载失败:', error);
        const errorMessage = error instanceof Error ? error.message : '无法下载报告';
        toast({
          title: '下载失败',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
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
      // 获取选中报告的 columnSn 列表
      const columnSns = selection.selectedItems;

      // 调用批量下载接口
      const response = await reportApi.downloadBatchReports(columnSns);

      const blob = new Blob([response.data], { type: 'application/zip' });

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reports_Batch_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 显示下载结果信息
      toast({
        title: '批量下载完成',
        description: `已开始下载 ${columnSns.length} 个报告的压缩包`,
      });

      // 清空选择
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
        console.error('获取报告详情失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        setPreviewError(error.response?.data?.message || error.message || '无法加载报告');
        toast({
          title: '预览失败',
          description: error.response?.data?.message || error.message || '无法加载报告',
          variant: 'destructive',
        });
      } finally {
        setPreviewLoading(false);
      }
    },
    [toast]
  );

  const handlePreviewById = useCallback(
    async (reportId, columnSn) => {
      try {
        setPreviewLoading(true);
        setPreviewError('');
        setPreviewColumnSn(columnSn || '');
        const response = await reportApi.previewReportById(reportId);

        const contentType = response?.headers?.['content-type'] || '';
        if (!contentType.includes('pdf')) {
          throw new Error('后端返回的不是PDF文件，无法预览');
        }
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);

        setPreviewBlobUrl(blobUrl);
        setPreviewUrl(blobUrl);
        setPreviewTitle(`报告预览 - ${columnSn || reportId}`);
        setPreviewDialogOpen(true);
      } catch (error) {
        console.error('获取报告详情失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        setPreviewError(error.response?.data?.message || error.message || '无法加载报告');
        toast({
          title: '预览失败',
          description: error.response?.data?.message || error.message || '无法加载报告',
          variant: 'destructive',
        });
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
        await reportApi.generateReport(columnSn, mode);
        toast({
          title: '生成成功',
          description: `报告 ${columnSn} 已重新生成`,
        });
        await fetchReports(pageNum, searchParams);
        setGenerateDialogOpen(false);
        setExistenceInfo(null);
        setGenerateTarget(null);
      } catch (error) {
        console.error('生成报告失败:', error);
        const backendMsg = error?.response?.data?.message;
        const errorMessage = backendMsg || (error instanceof Error ? error.message : '无法生成报告');
        toast({
          title: '生成失败',
          description: errorMessage,
          variant: 'destructive',
        });
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
        const info = await reportApi.checkReportExistence(columnSn);
        if (info?.exists) {
          setExistenceInfo(info);
          setGenerateDialogOpen(true);
          return;
        }
        await doGenerateReport(columnSn, 'BACKUP_OVERWRITE');
      } catch (error) {
        console.error('检查报告失败:', error);
        const backendMsg = error?.response?.data?.message;
        const errorMessage = backendMsg || (error instanceof Error ? error.message : '无法检查报告状态');
        toast({
          title: '操作失败',
          description: errorMessage,
          variant: 'destructive',
        });
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
            <AntdTag
              label={getUserTypeLabel(currentUser.type)}
              color="sky"
              showDot={false}
              prefix={<User className="w-3 h-3 mr-1" />}
            />
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
                reports={reports}
                selectedReports={selection.selectedItems}
                expandedRows={expand.expandedItems}
                onSelectReport={(columnSn) => selection.toggleSelection(columnSn)}
                onSelectAll={(checked) =>
                  selection.toggleSelectAll(
                    currentReports.map((r) => ({ id: r.columnSn })),
                    checked
                  )
                }
                onPreview={handlePreview}
                onGenerate={handleGenerate}
                onDownload={handleDownload}
              />
            )}
          </CardContent>
        </Card>

        {/* 分页组件 */}
        {total > 0 && <div className="mt-4">{renderPagination}</div>}

        {/* 空状态 */}
        {!loading && reports.length === 0 && <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无报告</h3>
              <p className="text-gray-500 mb-4">还没有生成任何检测报告</p>
              {/* <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                生成第一个报告
              </Button> */}
            </CardContent>
          </Card>}
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
            ) : previewUrl && (
              <div className="w-full h-full flex flex-col min-h-0">
                <div className="text-sm text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                  如果预览不显示，请尝试下载文件进行查看。
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full flex-1 min-h-0 border-0"
                  title="报告预览"
                  onLoad={() => {
                    console.log('报告预览已加载');
                  }}
                  onError={(e) => {
                    console.error('预览加载失败:', e);
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={generateDialogOpen}
        onOpenChange={(open) => {
          if (generating) return;
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
              当前层析柱：<span className="font-medium text-gray-900">{generateTarget?.columnSn}</span>
            </div>
            <div>
              当前报告ID：<span className="font-medium text-gray-900">{existenceInfo?.currentReportId}</span>
            </div>
            <div>
              历史备份数量：<span className="font-medium text-gray-900">{existenceInfo?.backupCount ?? 0}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              disabled={!existenceInfo?.currentReportId}
              onClick={() =>
                handlePreviewById(existenceInfo?.currentReportId, generateTarget?.columnSn)
              }
            >
              预览当前报告
            </Button>
            <Button
              onClick={() => doGenerateReport(generateTarget?.columnSn, 'BACKUP_OVERWRITE')}
              disabled={generating}
            >
              {generating ? '处理中...' : '备份后覆盖（推荐）'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => doGenerateReport(generateTarget?.columnSn, 'OVERWRITE_ONLY')}
              disabled={generating}
            >
              仅覆盖最新（不备份）
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const ok = window.confirm('确认清空所有历史备份后再覆盖生成？该操作不可恢复。');
                if (!ok) return;
                doGenerateReport(generateTarget?.columnSn, 'PURGE_AND_OVERWRITE');
              }}
              disabled={generating}
            >
              清空历史后覆盖（危险）
            </Button>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>;
}