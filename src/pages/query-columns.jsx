import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ArrowLeft, Search, Database, Loader2 } from 'lucide-react';
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';
import { AntdTag, ModeTag, StatusTag } from '@/components/AntdTag.jsx';
import { generatePageNumbers } from '@/utils/pagination';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES, TEST_TYPES, PAGINATION } from '@/constants';
import columnApi from '@/api/column';

export default function QueryColumnsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [draftSearchParams, setDraftSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    status: 'all',
  });

  const [appliedSearchParams, setAppliedSearchParams] = useState({
    sapWorkOrderNo: '',
    columnSn: '',
    sapOrderNo: '',
    deviceSn: '',
    mode: TEST_TYPES.ALL,
    status: 'all',
  });

  const currentUser = useMemo(
    () => ({
      name: '管理员',
      type: USER_TYPES.ADMIN,
    }),
    [],
  );

  const fields = useMemo(
    () => [
      {
        type: 'input',
        name: 'sapWorkOrderNo',
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
        name: 'sapOrderNo',
        label: '订单号',
        placeholder: '请输入订单号',
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
        label: '检测类型',
        placeholder: '选择检测类型',
        options: [
          { value: TEST_TYPES.ALL, label: '全部类型' },
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
        console.error('获取层析柱失败:', error);
        toast({
          title: '获取数据失败',
          description: error.response?.data?.message || error.message || '无法加载层析柱列表',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const handleSearch = useCallback(async () => {
    try {
      setAppliedSearchParams(draftSearchParams);
      const response = await fetchColumns(1, draftSearchParams);
      toast({
        title: '查询完成',
        description: `找到 ${response.total || 0} 条层析柱`,
      });
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: '搜索失败',
        description: '无法执行搜索操作',
        variant: 'destructive',
      });
    }
  }, [draftSearchParams, fetchColumns, toast]);

  const handleReset = useCallback(() => {
    const resetValues = {
      sapWorkOrderNo: '',
      columnSn: '',
      sapOrderNo: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
      status: 'all',
    };
    setDraftSearchParams(resetValues);
    setAppliedSearchParams(resetValues);
    fetchColumns(1, resetValues);
  }, [fetchColumns]);

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
    <div style={style} className="min-h-screen bg-gray-50">
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
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">柱子查询</h1>
              <p className="text-sm text-gray-500">查询层析柱全量信息</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AntdTag label={getUserTypeLabel(currentUser.type)} color="sky" showDot={false} />
          </div>
        </div>
      </div>

      <div className="p-6">
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
              <div className="text-sm text-gray-500">当前页显示 {columns.length} 条，共 {total} 条</div>
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
                      <TableHead className="w-40 whitespace-nowrap">层析柱序列号</TableHead>
                      <TableHead className="w-32 whitespace-nowrap">工单号</TableHead>
                      <TableHead className="w-32 whitespace-nowrap">订单号</TableHead>
                      <TableHead className="w-36 whitespace-nowrap">仪器序列号</TableHead>
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
                      <TableHead className="w-[280px] whitespace-nowrap">建议</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      columns.map((c) => (
                        <TableRow key={c.columnSn} className="hover:bg-gray-50">
                          <TableCell className="font-medium whitespace-nowrap truncate">{c.columnSn}</TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.sapWorkOrderNo || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap truncate">{c.sapOrderNo || '-'}</TableCell>
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
                          <TableCell className="truncate" title={c.suggestion || ''}>
                            {c.suggestion || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {total > 0 && <div className="mt-4">{renderPagination}</div>}
      </div>
    </div>
  );
}
