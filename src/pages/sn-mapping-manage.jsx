import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import snMappingApi from '@/api/snMapping';
import { showErrorToast } from '@/utils/toast';

export default function SnMappingManagePage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const resetFileInput = useCallback(() => {
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) {
      toast({
        title: '请选择文件',
        description: '请先选择要上传的.xlsx文件',
        variant: 'destructive',
      });
      return;
    }

    const name = file?.name || '';
    if (!name.toLowerCase().endsWith('.xlsx')) {
      toast({
        title: '文件类型不支持',
        description: '仅支持.xlsx文件',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const body = await snMappingApi.importXlsx(file);
      if (!body?.success) {
        throw new Error(body?.errorMsg || '导入失败');
      }
      setResult(body?.data || null);
      toast({
        title: '导入完成',
        description: '序列号映射表已处理完成',
      });
    } catch (error) {
      showErrorToast(toast, { title: '导入失败', description: '导入失败，请稍后重试' });
    } finally {
      setImporting(false);
      resetFileInput();
      setFile(null);
    }
  }, [file, resetFileInput, toast]);

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SN映射管理</h1>
          <div className="mt-1 text-sm text-slate-500">上传Excel导入成品序列号与自编序列号映射</div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>上传映射表（xlsx）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                表格需包含：工单号(AUFNR)、成品序列号(productSn)、自编序列号(columnSn)。
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e?.target?.files?.[0];
                    setFile(f || null);
                    setResult(null);
                  }}
                />
                <Button onClick={handleImport} disabled={importing || !file}>
                  {importing ? '导入中...' : '开始导入'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>导入结果</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-sm text-gray-500">暂无导入结果</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>总行数：{result.total ?? 0}</div>
                  <div>成功：{result.success ?? 0}</div>
                  <div>失败：{result.fail ?? 0}</div>
                  <div>回填成品序列号：{result.filledProductSn ?? 0}</div>
                  <div>回填工单号：{result.filledAufnr ?? 0}</div>
                </div>

                {Array.isArray(result.errors) && result.errors.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-900">错误明细</div>
                    <div className="mt-2 max-h-72 overflow-auto rounded bg-secondary p-2">
                      {result.errors.map((it, idx) => (
                        <div key={idx} className="text-xs text-foreground">
                          {it}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(result.rows) && result.rows.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-900">导入明细</div>
                    <div className="mt-2 max-h-96 overflow-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">行号</TableHead>
                            <TableHead>工单号</TableHead>
                            <TableHead>成品序列号</TableHead>
                            <TableHead>自编序列号</TableHead>
                            <TableHead className="w-20">结果</TableHead>
                            <TableHead>原因</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.rows.map((row, idx) => (
                            <TableRow key={`${row?.rowNum ?? idx}-${idx}`}>
                              <TableCell>{row?.rowNum ?? '-'}</TableCell>
                              <TableCell>{row?.aufnr ?? '-'}</TableCell>
                              <TableCell>{row?.productSn ?? '-'}</TableCell>
                              <TableCell>{row?.columnSn ?? '-'}</TableCell>
                              <TableCell>
                                <span className={row?.success ? 'text-primary' : 'text-foreground'}>
                                  {row?.success ? '成功' : '失败'}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">{row?.errorMsg ?? ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
