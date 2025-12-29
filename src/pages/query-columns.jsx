import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
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
import { ArrowLeft, Search, Database, User, Loader2 } from 'lucide-react';
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';
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

  const [searchParams, setSearchParams] = useState({
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
    async (page = 1, currentParams) => {
      setLoading(true);
      try {
        const params = currentParams !== undefined ? currentParams : searchParams;
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
    [searchParams, toast],
  );

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchColumns(1, searchParams);
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
    } finally {
      setLoading(false);
    }
  }, [fetchColumns, searchParams, toast]);

  const handleReset = useCallback(() => {
    const resetValues = {
      sapWorkOrderNo: '',
      columnSn: '',
      sapOrderNo: '',
      deviceSn: '',
      mode: TEST_TYPES.ALL,
      status: 'all',
    };
    setSearchParams(resetValues);
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
      fetchColumns(newPage, searchParams);
    },
    [fetchColumns, searchParams],
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
    fetchColumns(1, searchParams);
  }, [fetchColumns]);

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
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <User className="w-3 h-3 mr-1" />
              {getUserTypeLabel(currentUser.type)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <BaseSearchFilters
          title="查询条件"
          fields={fields}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>层析柱序列号</TableHead>
                      <TableHead>工单号</TableHead>
                      <TableHead>订单号</TableHead>
                      <TableHead>仪器序列号</TableHead>
                      <TableHead>检测模式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>成品序列号</TableHead>
                      <TableHead>检测日期</TableHead>
                      <TableHead>审核人</TableHead>
                      <TableHead>审核时间</TableHead>
                      <TableHead>设置温度</TableHead>
                      <TableHead>系统压力</TableHead>
                      <TableHead>出峰时间</TableHead>
                      <TableHead>CV值</TableHead>
                      <TableHead>建议</TableHead>
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
                          <TableCell className="font-medium">{c.columnSn}</TableCell>
                          <TableCell>{c.sapWorkOrderNo || '-'}</TableCell>
                          <TableCell>{c.sapOrderNo || '-'}</TableCell>
                          <TableCell>{c.deviceSn || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={c.mode === '糖化模式' ? 'default' : 'secondary'}>
                              {c.mode || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{c.status || '-'}</Badge>
                          </TableCell>
                          <TableCell>{c.preprocessColumnSn || '-'}</TableCell>
                          <TableCell>{c.inspectionDate || '-'}</TableCell>
                          <TableCell>{c.auditor || '-'}</TableCell>
                          <TableCell>{c.auditTime || '-'}</TableCell>
                          <TableCell>{c.setTemperature ?? '-'}</TableCell>
                          <TableCell>{c.pressure ?? '-'}</TableCell>
                          <TableCell>{c.peakTime ?? '-'}</TableCell>
                          <TableCell>{c.cvValue ?? '-'}</TableCell>
                          <TableCell className="max-w-[240px] truncate" title={c.suggestion || ''}>
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
