import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@/components/ui';
import { ArrowLeft, Database, Loader2, Pencil, Plus, Search, Trash2, User } from 'lucide-react';
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES } from '@/constants';
import columnApi from '@/api/column';

const STANDARD_TYPES = {
  ALL: 'all',
  CN: 'CN',
  EN: 'EN',
};

const EMPTY_FORM = {
  columnPrefix: '',
  seconds: '',
  standardType: STANDARD_TYPES.CN,
  productName: '',
  minTemperature: '',
  maxTemperature: '',
  minPressure: '',
  maxPressure: '',
  minPeakTime: '',
  maxPeakTime: '',
  maxCv: '',
  repeatabilityTest: '',
};

export default function StandardManagePage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const currentUser = useMemo(
    () => ({
      name: '管理员',
      type: USER_TYPES.ADMIN,
    }),
    [],
  );

  const [loading, setLoading] = useState(false);
  const [standards, setStandards] = useState([]);

  const [searchParams, setSearchParams] = useState({
    columnPrefix: '',
    standardType: STANDARD_TYPES.ALL,
    seconds: '',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStandard, setDeletingStandard] = useState(null);

  const fields = useMemo(
    () => [
      {
        type: 'input',
        name: 'columnPrefix',
        label: '层析柱前缀',
        placeholder: '例如：ABCD',
      },
      {
        type: 'select',
        name: 'standardType',
        label: '标准版本',
        placeholder: '选择标准版本',
        options: [
          { value: STANDARD_TYPES.ALL, label: '全部' },
          { value: STANDARD_TYPES.CN, label: '中文(CN)' },
          { value: STANDARD_TYPES.EN, label: '英文(EN)' },
        ],
      },
      {
        type: 'input',
        name: 'seconds',
        label: '秒数(可空)',
      },
    ],
    [],
  );

  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {},
    });
  }, [$w]);

  const toNumberOrNull = useCallback((v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }, []);

  const toBigDecimalOrNull = useCallback((v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? s : null;
  }, []);

  const fetchStandards = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const req = {
          columnPrefix: (params?.columnPrefix ?? '').trim(),
          standardType: params?.standardType === STANDARD_TYPES.ALL ? '' : params?.standardType,
          seconds: (params?.seconds ?? '').trim(),
        };

        const response = await columnApi.listStandards(req);
        const body = response?.data;
        const list = body?.data ?? [];

        if (!body?.success) {
          throw new Error(body?.errorMsg || '查询失败');
        }

        setStandards(Array.isArray(list) ? list : []);
        return list;
      } catch (e) {
        toast({
          title: '查询失败',
          description: e instanceof Error ? e.message : '无法查询标准列表',
          variant: 'destructive',
        });
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchStandards(searchParams);
  }, []);

  const handleSearch = useCallback(async () => {
    await fetchStandards(searchParams);
  }, [fetchStandards, searchParams]);

  const handleReset = useCallback(() => {
    const resetValues = {
      columnPrefix: '',
      standardType: STANDARD_TYPES.ALL,
      seconds: '',
    };
    setSearchParams(resetValues);
    fetchStandards(resetValues);
  }, [fetchStandards]);

  const openCreateDialog = useCallback(() => {
    setEditingStandard(null);
    setForm({ ...EMPTY_FORM, standardType: STANDARD_TYPES.CN });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((s) => {
    setEditingStandard(s);
    setForm({
      columnPrefix: s?.columnPrefix ?? '',
      seconds: s?.seconds == null ? '' : String(s.seconds),
      standardType: s?.standardType ?? STANDARD_TYPES.CN,
      productName: s?.productName ?? '',
      minTemperature: s?.minTemperature ?? '',
      maxTemperature: s?.maxTemperature ?? '',
      minPressure: s?.minPressure ?? '',
      maxPressure: s?.maxPressure ?? '',
      minPeakTime: s?.minPeakTime ?? '',
      maxPeakTime: s?.maxPeakTime ?? '',
      maxCv: s?.maxCv ?? '',
      repeatabilityTest: s?.repeatabilityTest ?? '',
    });
    setDialogOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    const prefix = String(form.columnPrefix ?? '').trim();
    if (!prefix) return '层析柱前缀不能为空';
    if (prefix.length < 4) return '层析柱前缀长度不能小于4';

    if (!form.standardType) return '标准版本不能为空';

    const requiredText = [
      { key: 'productName', label: '产品名称' },
      { key: 'repeatabilityTest', label: '重复性测试字段（如CV值≤1.5%）' },
    ];
    for (const item of requiredText) {
      const v = String(form[item.key] ?? '').trim();
      if (!v) return `${item.label}不能为空`;
    }

    const requiredNumbers = [
      { key: 'minTemperature', label: '最低温度' },
      { key: 'maxTemperature', label: '最高温度' },
      { key: 'minPressure', label: '最低压力' },
      { key: 'maxPressure', label: '最高压力' },
      { key: 'minPeakTime', label: '最小出峰时间' },
      { key: 'maxPeakTime', label: '最大出峰时间' },
      { key: 'maxCv', label: '最大CV' },
    ];

    for (const item of requiredNumbers) {
      const raw = String(form[item.key] ?? '').trim();
      if (!raw) return `${item.label}不能为空`;
      const num = Number(raw);
      if (!Number.isFinite(num)) return `${item.label}必须是数字`;
    }

    if (form.seconds != null && String(form.seconds).trim()) {
      const s = toNumberOrNull(form.seconds);
      if (s == null || !Number.isInteger(s) || s < 0) return '秒数必须是非负整数或留空';
    }

    return null;
  }, [form, toNumberOrNull]);

  const buildRequest = useCallback(() => {
    const seconds = String(form.seconds ?? '').trim();

    return {
      columnPrefix: String(form.columnPrefix ?? '').trim(),
      seconds: seconds ? toNumberOrNull(seconds) : null,
      standardType: form.standardType,
      productName: String(form.productName ?? '').trim(),
      minTemperature: toBigDecimalOrNull(form.minTemperature),
      maxTemperature: toBigDecimalOrNull(form.maxTemperature),
      minPressure: toBigDecimalOrNull(form.minPressure),
      maxPressure: toBigDecimalOrNull(form.maxPressure),
      minPeakTime: toBigDecimalOrNull(form.minPeakTime),
      maxPeakTime: toBigDecimalOrNull(form.maxPeakTime),
      maxCv: toBigDecimalOrNull(form.maxCv),
      repeatabilityTest: String(form.repeatabilityTest ?? '').trim(),
    };
  }, [form, toBigDecimalOrNull, toNumberOrNull]);

  const handleSave = useCallback(async () => {
    const err = validateForm();
    if (err) {
      toast({
        title: '校验失败',
        description: err,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const req = buildRequest();

      let response;
      if (editingStandard) {
        response = await columnApi.updateStandard(req);
      } else {
        response = await columnApi.addStandard(req);
      }

      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '保存失败');
      }

      toast({
        title: '保存成功',
        description: editingStandard ? '标准已更新' : '标准已新增',
      });

      setDialogOpen(false);
      await fetchStandards(searchParams);
    } catch (e) {
      toast({
        title: '保存失败',
        description: e instanceof Error ? e.message : '无法保存标准',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [buildRequest, editingStandard, fetchStandards, searchParams, toast, validateForm]);

  const requestDelete = useCallback((s) => {
    setDeletingStandard(s);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingStandard?.id) {
      toast({
        title: '删除失败',
        description: '缺少id，无法删除',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      return;
    }

    setSaving(true);
    try {
      const response = await columnApi.deleteStandardById(deletingStandard.id);
      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '删除失败');
      }

      toast({
        title: '删除成功',
        description: '标准已删除',
      });

      setDeleteDialogOpen(false);
      setDeletingStandard(null);
      await fetchStandards(searchParams);
    } catch (e) {
      toast({
        title: '删除失败',
        description: e instanceof Error ? e.message : '无法删除标准',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [deletingStandard?.id, fetchStandards, searchParams, toast]);

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
              <h1 className="text-2xl font-bold text-gray-900">标准/模板管理</h1>
              <p className="text-sm text-gray-500">新增、编辑与维护层析柱标准模板</p>
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
                标准列表
              </span>
              <div className="flex items-center gap-2">
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新增标准
                </Button>
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
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>前缀</TableHead>
                      <TableHead>版本</TableHead>
                      <TableHead>秒数</TableHead>
                      <TableHead>产品名称</TableHead>
                      <TableHead>温度范围</TableHead>
                      <TableHead>压力范围</TableHead>
                      <TableHead>出峰时间</TableHead>
                      <TableHead>最大CV</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      standards.map((s) => (
                        <TableRow key={s.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{s.columnPrefix}</TableCell>
                          <TableCell>{s.standardType || '-'}</TableCell>
                          <TableCell>{s.seconds == null ? '-' : s.seconds}</TableCell>
                          <TableCell>{s.productName || '-'}</TableCell>
                          <TableCell>
                            {s.minTemperature} ~ {s.maxTemperature}
                          </TableCell>
                          <TableCell>
                            {s.minPressure} ~ {s.maxPressure}
                          </TableCell>
                          <TableCell>
                            {s.minPeakTime} ~ {s.maxPeakTime}
                          </TableCell>
                          <TableCell>{s.maxCv}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(s)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => requestDelete(s)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStandard ? '编辑标准' : '新增标准'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">层析柱前缀</label>
                  <Input
                    value={form.columnPrefix}
                    onChange={(e) => setForm((p) => ({ ...p, columnPrefix: e.target.value }))}
                    disabled={!!editingStandard}
                    className={editingStandard ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : undefined}
                    placeholder="例：I02B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标准版本</label>
                  <Select
                    value={form.standardType}
                    onValueChange={(v) => setForm((p) => ({ ...p, standardType: v }))}
                    disabled={!!editingStandard}
                  >
                    <SelectTrigger className={editingStandard ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : undefined}>
                      <SelectValue placeholder="选择版本" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={STANDARD_TYPES.CN}>中文(CN)</SelectItem>
                      <SelectItem value={STANDARD_TYPES.EN}>英文(EN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">秒数(可空)</label>
                  <Input
                    value={form.seconds}
                    onChange={(e) => setForm((p) => ({ ...p, seconds: e.target.value }))}
                    disabled={!!editingStandard}
                    className={editingStandard ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : undefined}
                    placeholder="请输入非负整数，无则留空"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                  <Input
                    value={form.productName}
                    onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))}
                    placeholder="请输入报告名称，例：“层析柱 H9/C2 中文 96s”或者“Chromatographic Column(HPLC) for H9 96S”"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低温度</label>
                  <Input
                    value={form.minTemperature}
                    onChange={(e) => setForm((p) => ({ ...p, minTemperature: e.target.value }))}
                    placeholder="例如：20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最高温度</label>
                  <Input
                    value={form.maxTemperature}
                    onChange={(e) => setForm((p) => ({ ...p, maxTemperature: e.target.value }))}
                    placeholder="例如：30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低压力</label>
                  <Input
                    value={form.minPressure}
                    onChange={(e) => setForm((p) => ({ ...p, minPressure: e.target.value }))}
                    placeholder="例如：0.3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最高压力</label>
                  <Input
                    value={form.maxPressure}
                    onChange={(e) => setForm((p) => ({ ...p, maxPressure: e.target.value }))}
                    placeholder="例如：0.8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小出峰时间</label>
                  <Input
                    value={form.minPeakTime}
                    onChange={(e) => setForm((p) => ({ ...p, minPeakTime: e.target.value }))}
                    placeholder="例如：10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大出峰时间</label>
                  <Input
                    value={form.maxPeakTime}
                    onChange={(e) => setForm((p) => ({ ...p, maxPeakTime: e.target.value }))}
                    placeholder="例如：15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大CV</label>
                  <Input
                    value={form.maxCv}
                    onChange={(e) => setForm((p) => ({ ...p, maxCv: e.target.value }))}
                    placeholder="例如：1.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">重复性测试</label>
                  <Input
                    value={form.repeatabilityTest}
                    onChange={(e) => setForm((p) => ({ ...p, repeatabilityTest: e.target.value }))}
                    placeholder="请输入重复性测试字段，例：“CV＜1.5%”"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      保存
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确认删除标准：{deletingStandard?.columnPrefix} / {deletingStandard?.standardType} /{' '}
                {deletingStandard?.seconds == null ? '秒数为空' : `秒数=${deletingStandard?.seconds}`}？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={saving}>
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
