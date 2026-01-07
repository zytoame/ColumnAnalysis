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
import { AntdTag } from '@/components/AntdTag.jsx';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES } from '@/constants';
import { ArrowLeft, Cpu, Loader2, Plug, Plus, RefreshCw, Unplug, Pencil, Trash2 } from 'lucide-react';
import deviceConfigApi from '@/api/deviceConfig';

const EMPTY_FORM = {
  name: '',
  host: '',
  port: '',
  mode: 'SOCKET',
};

function StatusBadge({ status }) {
  if (status === 'CONNECTED') {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200" variant="secondary">
        已连接
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-700 border border-gray-200" variant="secondary">
      未连接
    </Badge>
  );
}

export default function DeviceConfigPage(props) {
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
  const [saving, setSaving] = useState(false);

  const [machines, setMachines] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMachine, setDeletingMachine] = useState(null);

  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {},
    });
  }, [$w]);

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
      toast({
        title: '获取失败',
        description: e instanceof Error ? e.message : '获取机器列表失败',
        variant: 'destructive',
      });
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
      console.warn('fetch status failed:', e);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
    fetchStatus();
  }, [fetchMachines, fetchStatus]);

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
      toast({
        title: '保存失败',
        description: e instanceof Error ? e.message : '保存失败',
        variant: 'destructive',
      });
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
      toast({
        title: '删除失败',
        description: e instanceof Error ? e.message : '无法删除机器',
        variant: 'destructive',
      });
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
        toast({
          title: '连接失败',
          description: e instanceof Error ? e.message : '连接失败',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [fetchStatus, toast],
  );

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
        toast({
          title: '断开失败',
          description: e instanceof Error ? e.message : '断开失败',
          variant: 'destructive',
        });
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

  return (
    <div style={style} className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBackToMain} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回主页
            </Button>
            <Cpu className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">设备连接配置</h1>
              <p className="text-sm text-gray-500">配置机器 IP/端口/连接模式，并手动连接与断开</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AntdTag label={getUserTypeLabel(currentUser.type)} color="sky" showDot={false} />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">机器列表</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchStatus} disabled={saving} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  刷新状态
                </Button>
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
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
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-56">名称</TableHead>
                      <TableHead className="w-28">模式</TableHead>
                      <TableHead className="w-56">Host</TableHead>
                      <TableHead className="w-24">端口</TableHead>
                      <TableHead className="w-28">状态</TableHead>
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

                        return (
                          <TableRow key={m.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell>{m.mode}</TableCell>
                            <TableCell>{m.host}</TableCell>
                            <TableCell>{m.port}</TableCell>
                            <TableCell>
                              <StatusBadge status={status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => requestDelete(m)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {connected ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisconnect(m.id)}
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                  >
                                    <Unplug className="w-4 h-4" />
                                    断开
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConnect(m.id)}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
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
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
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
