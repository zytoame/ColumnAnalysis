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
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
import { Cpu, Loader2, Plug, Plus, RefreshCw, Unplug, Pencil, Trash2 } from 'lucide-react';
import deviceConfigApi from '@/api/deviceConfig';
import { showErrorToast } from '@/utils/toast';

const EMPTY_FORM = {
  name: '',
  host: '',
  port: '',
  mode: 'SOCKET',
};

export default function DeviceConfigPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [machines, setMachines] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMachine, setDeletingMachine] = useState(null);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deviceConfigApi.listMachines();
      const body = response?.data;
      const list = body?.data ?? [];
      if (!body?.success) {
        throw new Error(body?.errorMsg || '获取机器列表失败');
      }
      setMachines(Array.isArray(list) ? list : []);
    } catch (e) {
      showErrorToast(toast, { title: '获取失败', description: '获取机器列表失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await deviceConfigApi.status();
      const body = response?.data;
      const list = body?.data ?? [];
      if (!body?.success) {
        throw new Error(body?.errorMsg || '获取连接状态失败');
      }
      setStatusList(Array.isArray(list) ? list : []);
    } catch (e) {
      // 状态轮询失败不弹窗刷屏，只在控制台打印
      // eslint-disable-next-line no-console
      if (import.meta.env.DEV) {
        console.warn('fetch status failed:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchMachines();
    fetchStatus();
  }, [fetchMachines, fetchStatus]);

  useEffect(() => {
    const ids = new Set((machines || []).map((m) => m?.id).filter(Boolean));
    setSelectedIds((prev) => (prev || []).filter((id) => ids.has(id)));
  }, [machines]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchStatus();
    }, 2000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const statusMap = useMemo(() => {
    const m = new Map();
    for (const s of statusList) {
      if (s?.id) m.set(s.id, s);
    }
    return m;
  }, [statusList]);

  const selectableIds = useMemo(() => {
    return (machines || []).map((m) => m?.id).filter(Boolean);
  }, [machines]);

  const selectedIdSet = useMemo(() => {
    return new Set(selectedIds || []);
  }, [selectedIds]);

  const allSelected = useMemo(() => {
    if (!selectableIds.length) return false;
    return selectableIds.every((id) => selectedIdSet.has(id));
  }, [selectableIds, selectedIdSet]);

  const someSelected = useMemo(() => {
    if (!selectableIds.length) return false;
    return selectableIds.some((id) => selectedIdSet.has(id)) && !allSelected;
  }, [allSelected, selectableIds, selectedIdSet]);

  const headerChecked = useMemo(() => {
    if (allSelected) return true;
    if (someSelected) return 'indeterminate';
    return false;
  }, [allSelected, someSelected]);

  const toggleSelectAll = useCallback(
    (checked) => {
      if (checked === true) {
        setSelectedIds(selectableIds);
      } else {
        setSelectedIds([]);
      }
    },
    [selectableIds],
  );

  const toggleSelectOne = useCallback((id, checked) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const set = new Set(prev || []);
      if (checked === true) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingMachine(null);
    setForm({ ...EMPTY_FORM, mode: 'SOCKET' });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((m) => {
    setEditingMachine(m);
    setForm({
      name: m?.name ?? '',
      host: m?.host ?? '',
      port: m?.port == null ? '' : String(m.port),
      mode: m?.mode ?? 'SOCKET',
    });
    setDialogOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    const name = String(form.name ?? '').trim();
    const host = String(form.host ?? '').trim();
    const portStr = String(form.port ?? '').trim();

    if (!name) return '机器名称不能为空';
    if (!host) return 'IP/Host不能为空';

    const port = Number(portStr);
    if (!Number.isFinite(port) || port <= 0 || port > 65535) return '端口不合法';

    if (!form.mode) return '连接模式不能为空';

    return null;
  }, [form.host, form.mode, form.name, form.port]);

  const buildRequest = useCallback(() => {
    return {
      name: String(form.name ?? '').trim(),
      host: String(form.host ?? '').trim(),
      port: Number(String(form.port ?? '').trim()),
      mode: form.mode,
    };
  }, [form.host, form.mode, form.name, form.port]);

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
      if (editingMachine?.id) {
        response = await deviceConfigApi.updateMachine(editingMachine.id, req);
      } else {
        response = await deviceConfigApi.createMachine(req);
      }

      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '保存失败');
      }

      toast({
        title: '保存成功',
        description: editingMachine ? '机器配置已更新' : '机器已添加',
      });

      setDialogOpen(false);
      await fetchMachines();
      await fetchStatus();
    } catch (e) {
      showErrorToast(toast, { title: '保存失败', description: '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }, [buildRequest, editingMachine, fetchMachines, fetchStatus, toast, validateForm]);

  const requestDelete = useCallback((m) => {
    setDeletingMachine(m);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingMachine?.id) {
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
      const response = await deviceConfigApi.deleteMachine(deletingMachine.id);
      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '删除失败');
      }

      toast({
        title: '删除成功',
        description: '机器已删除',
      });

      setDeleteDialogOpen(false);
      setDeletingMachine(null);
      await fetchMachines();
      await fetchStatus();
    } catch (e) {
      showErrorToast(toast, { title: '删除失败', description: '删除失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }, [deletingMachine?.id, fetchMachines, fetchStatus, toast]);

  const handleConnect = useCallback(
    async (id) => {
      if (!id) return;
      setSaving(true);
      try {
        const response = await deviceConfigApi.connect(id);
        const body = response?.data;
        if (!body?.success) {
          throw new Error(body?.errorMsg || '连接失败');
        }
        toast({
          title: '连接成功',
          description: '已发起连接',
        });
        await fetchStatus();
      } catch (e) {
        showErrorToast(toast, { title: '连接失败', description: '连接失败，请稍后重试' });
      } finally {
        setSaving(false);
      }
    },
    [fetchStatus, toast],
  );

  const handleBatchConnect = useCallback(async () => {
    if (!selectedIds?.length) {
      toast({
        title: '未选择机器',
        description: '请先勾选要连接的机器',
        variant: 'destructive',
      });
      return;
    }

    const idsToConnect = (selectedIds || []).filter((id) => {
      const s = statusMap.get(id);
      return s?.active !== true;
    });

    const skipped = (selectedIds?.length || 0) - idsToConnect.length;
    if (!idsToConnect.length) {
      toast({
        title: '无需连接',
        description: skipped ? '所选机器均已连接' : '未找到可连接的机器',
      });
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.allSettled(
        idsToConnect.map(async (id) => {
          const response = await deviceConfigApi.connect(id);
          const body = response?.data;
          if (!body?.success) {
            throw new Error(body?.errorMsg || '连接失败');
          }
          return true;
        }),
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      toast({
        title: '批量连接已执行',
        description: `目标：${idsToConnect.length}，成功：${successCount}，失败：${failCount}${skipped ? `，跳过：${skipped}` : ''}`,
      });

      await fetchStatus();
    } catch (e) {
      showErrorToast(toast, { title: '批量连接失败', description: '批量连接失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }, [fetchStatus, selectedIds, statusMap, toast]);

  const handleBatchDisconnect = useCallback(async () => {
    if (!selectedIds?.length) {
      toast({
        title: '未选择机器',
        description: '请先勾选要断开的机器',
        variant: 'destructive',
      });
      return;
    }

    const idsToDisconnect = (selectedIds || []).filter((id) => {
      const s = statusMap.get(id);
      return s?.active === true;
    });

    const skipped = (selectedIds?.length || 0) - idsToDisconnect.length;
    if (!idsToDisconnect.length) {
      toast({
        title: '无需断开',
        description: skipped ? '所选机器均未连接' : '未找到可断开的机器',
      });
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.allSettled(
        idsToDisconnect.map(async (id) => {
          const response = await deviceConfigApi.disconnect(id);
          const body = response?.data;
          if (!body?.success) {
            throw new Error(body?.errorMsg || '断开失败');
          }
          return true;
        }),
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      toast({
        title: '批量断开已执行',
        description: `目标：${idsToDisconnect.length}，成功：${successCount}，失败：${failCount}${skipped ? `，跳过：${skipped}` : ''}`,
      });

      await fetchStatus();
    } catch (e) {
      showErrorToast(toast, { title: '批量断开失败', description: '批量断开失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }, [fetchStatus, selectedIds, statusMap, toast]);

  const handleDisconnect = useCallback(
    async (id) => {
      if (!id) return;
      setSaving(true);
      try {
        const response = await deviceConfigApi.disconnect(id);
        const body = response?.data;
        if (!body?.success) {
          throw new Error(body?.errorMsg || '断开失败');
        }
        toast({
          title: '已断开',
          description: '连接已断开',
        });
        await fetchStatus();
      } catch (e) {
        showErrorToast(toast, { title: '断开失败', description: '断开失败，请稍后重试' });
      } finally {
        setSaving(false);
      }
    },
    [fetchStatus, toast],
  );

  const renderRowStatus = useCallback(
    (machineId) => {
      const s = statusMap.get(machineId);
      return s?.status || 'DISCONNECTED';
    },
    [statusMap],
  );

  const renderRowActive = useCallback(
    (machineId) => {
      const s = statusMap.get(machineId);
      return s?.active === true;
    },
    [statusMap],
  );

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">设备连接配置</h1>
          <div className="mt-1 text-sm text-slate-500">配置机器 IP/端口/连接模式，并手动连接与断开</div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">机器列表</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBatchConnect}
                  disabled={saving || (selectedIds?.length ?? 0) === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  <Plug className="w-4 h-4" />
                  批量连接
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDisconnect}
                  disabled={saving || (selectedIds?.length ?? 0) === 0}
                  className="flex items-center gap-2"
                >
                  <Unplug className="w-4 h-4" />
                  批量断开
                </Button>
                <Button variant="outline" onClick={fetchStatus} disabled={saving} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  刷新状态
                </Button>
                <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  添加机器
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
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} disabled={!selectableIds.length} />
                      </TableHead>
                      <TableHead className="w-56">名称</TableHead>
                      <TableHead className="w-28">模式</TableHead>
                      <TableHead className="w-56">Host</TableHead>
                      <TableHead className="w-24">端口</TableHead>
                      <TableHead className="w-56">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          暂无机器，请点击右上角“添加机器”
                        </TableCell>
                      </TableRow>
                    ) : (
                      machines.map((m) => {
                        const status = renderRowStatus(m.id);
                        const connected = status === 'CONNECTED';
                        const active = renderRowActive(m.id);

                        return (
                          <TableRow key={m.id} className="hover:bg-secondary">
                            <TableCell>
                              <Checkbox
                                checked={m?.id ? selectedIdSet.has(m.id) : false}
                                onCheckedChange={(checked) => toggleSelectOne(m.id, checked)}
                                disabled={!m?.id}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell>{m.mode}</TableCell>
                            <TableCell>{m.host}</TableCell>
                            <TableCell>{m.port}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => requestDelete(m)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {active ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisconnect(m.id)}
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                  >
                                    <Unplug className="w-4 h-4" />
                                    {connected ? '断开' : '停止重试'}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConnect(m.id)}
                                    disabled={saving}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                                  >
                                    <Plug className="w-4 h-4" />
                                    连接
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMachine ? '编辑机器' : '添加机器'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">机器名称</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如：1号机器" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">连接模式</label>
                  <Select value={form.mode} onValueChange={(v) => setForm((p) => ({ ...p, mode: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOCKET">SOCKET</SelectItem>
                      <SelectItem value="MQTT">MQTT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
                  <Input value={form.port} onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))} placeholder="例如：20001" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP/Host</label>
                <Input value={form.host} onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))} placeholder="例如：10.0.44.120 或 broker.emqx.io" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving ? '保存中...' : '保存'}
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
                确认删除机器：{deletingMachine?.name}（{deletingMachine?.mode} {deletingMachine?.host}:{deletingMachine?.port}）？
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
