import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
} from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { showErrorToast } from '@/utils/toast';
import { generatePageNumbers } from '@/utils/pagination';
import { PAGINATION } from '@/constants';
import columnApi from '@/api/column';
import snMappingApi from '@/api/snMapping';

export default function UnmatchedManagePage(props) {
  const { style, embedded, initialTab, initialBatchId } = props;
  const { toast } = useToast();

  const location = useLocation();

  const query = useMemo(() => {
    if (embedded) {
      return new URLSearchParams('');
    }
    try {
      return new URLSearchParams(location?.search || '');
    } catch (e) {
      return new URLSearchParams('');
    }
  }, [embedded, location?.search]);

  const [tab, setTab] = useState('columns');
  const [batchId, setBatchId] = useState('');

  const [columnKeyword, setColumnKeyword] = useState('');
  const [columns, setColumns] = useState([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsPageNum, setColumnsPageNum] = useState(1);
  const [columnsTotal, setColumnsTotal] = useState(0);
  const columnsTotalPages = useMemo(
    () => Math.ceil((columnsTotal || 0) / PAGINATION.DEFAULT_PAGE_SIZE),
    [columnsTotal],
  );

  const [mappingKeyword, setMappingKeyword] = useState('');
  const [mappingAll, setMappingAll] = useState(false);
  const [showBatchId, setShowBatchId] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [mappingsPageNum, setMappingsPageNum] = useState(1);
  const [mappingsTotal, setMappingsTotal] = useState(0);
  const mappingsTotalPages = useMemo(
    () => Math.ceil((mappingsTotal || 0) / PAGINATION.DEFAULT_PAGE_SIZE),
    [mappingsTotal],
  );

  const fetchUnmatchedColumns = useCallback(
    async (page = 1, keyword) => {
      setColumnsLoading(true);
      try {
        const resp = await columnApi.getUnmatchedColumns(page, PAGINATION.DEFAULT_PAGE_SIZE, keyword);
        const data = resp?.data || {};
        setColumns(data.records || []);
        setColumnsTotal(data.total || 0);
        setColumnsPageNum(page);
        return data;
      } catch (error) {
        console.error('【未匹配列表】获取未匹配层析柱失败', error);
        showErrorToast(toast, { title: '获取数据失败', description: '无法加载未匹配层析柱列表，请稍后重试' });
        throw error;
      } finally {
        setColumnsLoading(false);
      }
    },
    [toast],
  );

  const fetchUnmatchedMappings = useCallback(
    async (page = 1, params) => {
      setMappingsLoading(true);
      try {
        const body = await snMappingApi.getUnmatchedMappings({
          pageNum: page,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          batchId: params?.batchId,
          all: params?.all,
          keyword: params?.keyword,
        });

        if (body?.success === false) {
          throw new Error(body?.errorMsg || '获取失败');
        }

        const list = body?.data || [];
        const total = body?.total || 0;
        setMappings(Array.isArray(list) ? list : []);
        setMappingsTotal(total);
        setMappingsPageNum(page);
        return { list, total };
      } catch (error) {
        console.error('【未匹配列表】获取未匹配映射失败', error);
        showErrorToast(toast, { title: '获取数据失败', description: '无法加载未匹配映射列表，请稍后重试' });
        throw error;
      } finally {
        setMappingsLoading(false);
      }
    },
    [toast],
  );

  // 参数同步：使用useLayoutEffect确保在渲染前执行
  useLayoutEffect(() => {
    if (embedded) {
      const nextTab = String(initialTab || '').trim() || (initialBatchId ? 'mappings' : 'columns');
      const nextBatchId = String(initialBatchId || '').trim();
      setTab(nextTab);
      setBatchId(nextBatchId);
      return;
    }

    const qTab = query.get('tab') || '';
    const qBatchId = query.get('batchId') || '';

    if (qBatchId) {
      setTab(qTab || 'mappings');
      setBatchId(qBatchId);
      return;
    }

    setTab(qTab || 'columns');
    setBatchId('');
  }, [embedded, initialBatchId, initialTab, query]);

  // tab切换时自动加载第一页
  useEffect(() => {
    if (tab === 'columns') {
      fetchUnmatchedColumns(1, columnKeyword).catch(() => {});
      return;
    }

    fetchUnmatchedMappings(1, {
      batchId,
      all: mappingAll,
      keyword: mappingKeyword,
    }).catch(() => {});
  }, [
    tab,
    batchId,
    columnKeyword,
    mappingAll,
    mappingKeyword,
  ]);

  const renderPagination = useCallback(
    ({ pageNum, totalPages, onPageChange, disabled }) => {
      const pages = generatePageNumbers(pageNum, totalPages);
      if (!pages || pages.length === 0) return null;

      return (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  if (pageNum > 1) onPageChange(pageNum - 1);
                }}
              />
            </PaginationItem>

            {pages.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === pageNum}
                    onClick={(e) => {
                      e.preventDefault();
                      if (disabled) return;
                      onPageChange(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  if (pageNum < totalPages) onPageChange(pageNum + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    },
    [],
  );

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">未匹配列表</h1>
          <div className="mt-1 text-sm text-slate-500">查看柱子与SN映射的未匹配数据</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="columns">柱子未匹配</TabsTrigger>
          <TabsTrigger value="mappings">映射未匹配</TabsTrigger>
        </TabsList>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>柱子未匹配</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="关键字：columnSn / aufnr / deviceSn"
                    value={columnKeyword}
                    onChange={(e) => setColumnKeyword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={columnsLoading}
                    onClick={() => {
                      fetchUnmatchedColumns(1, columnKeyword)
                        .then((d) => {
                          toast({
                            title: '查询完成',
                            description: `找到 ${d?.total || 0} 条未匹配柱子`,
                          });
                        })
                        .catch(() => {});
                    }}
                  >
                    查询
                  </Button>
                  <Button
                    variant="outline"
                    disabled={columnsLoading}
                    onClick={() => {
                      setColumnKeyword('');
                      fetchUnmatchedColumns(1, '')
                        .then((d) => {
                          toast({
                            title: '已重置',
                            description: `当前 ${d?.total || 0} 条未匹配柱子`,
                          });
                        })
                        .catch(() => {});
                    }}
                  >
                    重置
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>柱子序列号</TableHead>
                      <TableHead>工单号</TableHead>
                      <TableHead>仪器序列号</TableHead>
                      <TableHead>检测模式</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                {/* 柱子未匹配表格 */}
                <TableBody>
                  {columnsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : columns?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    columns.map((c, idx) => (
                      <TableRow key={`${c?.columnSn || idx}-${idx}`}>
                        <TableCell>{c?.columnSn || '-'}</TableCell>
                        <TableCell>{c?.aufnr || '-'}</TableCell>
                        <TableCell>{c?.deviceSn || '-'}</TableCell>
                        <TableCell>{c?.mode || '-'}</TableCell>
                        <TableCell>{c?.status || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>

              {renderPagination({
                pageNum: columnsPageNum,
                totalPages: columnsTotalPages,
                disabled: columnsLoading,
                onPageChange: (p) => fetchUnmatchedColumns(p, columnKeyword).catch(() => {}),
              })}
            </CardContent>
          </Card>
        </TabsContent>

        // 映射未匹配表格
        <TabsContent value="mappings">
          <Card>
            <CardHeader>
              <CardTitle>映射未匹配</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <div className="text-sm text-muted-foreground">本次导入批次</div>
                  <Input
                    placeholder="batchId 将由导入页自动带入"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    disabled
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="text-sm text-muted-foreground">关键字</div>
                  <Input
                    placeholder="关键字：columnSn / productSn / aufnr"
                    value={mappingKeyword}
                    onChange={(e) => setMappingKeyword(e.target.value)}
                  />
                </div>

                <div className="md:col-span-1 flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mappingAll}
                        onCheckedChange={(v) => {
                          setMappingAll(v === true);
                        }}
                      />
                      <div className="text-sm">查询全量未匹配</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showBatchId}
                        onCheckedChange={(v) => {
                          setShowBatchId(v === true);
                        }}
                      />
                      <div className="text-sm">显示批次ID</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={mappingsLoading}
                      onClick={() => {
                        fetchUnmatchedMappings(1, {
                          batchId,
                          all: mappingAll,
                          keyword: mappingKeyword,
                        })
                          .then((d) => {
                            toast({
                              title: '查询完成',
                              description: `找到 ${d?.total || 0} 条未匹配映射`,
                            });
                          })
                          .catch(() => {});
                      }}
                    >
                      查询
                    </Button>
                    <Button
                      variant="outline"
                      disabled={mappingsLoading}
                      onClick={() => {
                        setMappingKeyword('');
                        setMappingAll(false);
                        fetchUnmatchedMappings(1, {
                          batchId,
                          all: false,
                          keyword: '',
                        }).catch(() => {});
                      }}
                    >
                      重置
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>自编序列号</TableHead>
                      <TableHead>成品序列号</TableHead>
                      <TableHead>工单号</TableHead>
                      {showBatchId && <TableHead>批次ID</TableHead>}
                    </TableRow>
                  </TableHeader>
                  {/* 映射未匹配表格内容 */}
                  <TableBody>
                    {mappingsLoading ? (
                      <TableRow>
                        <TableCell colSpan={showBatchId ? 4 : 3} className="text-center text-sm text-muted-foreground">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : mappings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showBatchId ? 4 : 3} className="text-center text-sm text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      mappings.map((m, idx) => (
                        <TableRow key={`${m?.id || idx}-${idx}`}>
                          <TableCell>{m?.columnSn || '-'}</TableCell>
                          <TableCell>{m?.productSn || '-'}</TableCell>
                          <TableCell>{m?.aufnr || '-'}</TableCell>
                          {showBatchId && (
                            <TableCell className="text-xs text-muted-foreground">{m?.batchId || '-'}</TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {renderPagination({
                pageNum: mappingsPageNum,
                totalPages: mappingsTotalPages,
                disabled: mappingsLoading,
                onPageChange: (p) =>
                  fetchUnmatchedMappings(p, {
                    batchId,
                    all: mappingAll,
                    keyword: mappingKeyword,
                  }).catch(() => {}),
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
