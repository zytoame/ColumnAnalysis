import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@/components/ui';
import { ArrowLeft, Loader2, PenTool } from 'lucide-react';
import { AntdTag } from '@/components/AntdTag.jsx';
import { getUserTypeLabel } from '@/utils/format';
import { USER_TYPES } from '@/constants';
import signatureSettingsApi from '@/api/signatureSettings';

export default function SignatureSettingsPage(props) {
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
  const [settings, setSettings] = useState(null);

  const [role, setRole] = useState('INSPECTION');
  const [userId, setUserId] = useState('');

  const handleBackToMain = useCallback(() => {
    $w?.utils.navigateTo({
      pageId: 'main',
      params: {
        from: 'signature-settings',
      },
    });
  }, [$w]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await signatureSettingsApi.getSettings();
      const body = response?.data;
      const data = body?.data ?? null;
      if (!body?.success || !data) {
        throw new Error(body?.errorMsg || '获取签名配置失败');
      }
      setSettings(data);
    } catch (error) {
      toast({
        title: '获取失败',
        description: error?.message || '获取签名配置失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = useCallback(async () => {
    const trimmed = (userId || '').trim();
    if (!trimmed) {
      toast({
        title: '请输入工号',
        description: '工号不能为空',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await signatureSettingsApi.updateSettings({
        role,
        userId: trimmed,
      });
      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '保存失败');
      }
      toast({
        title: '保存成功',
        description: '签名配置已更新',
      });
      setUserId('');
      await fetchSettings();
    } catch (error) {
      toast({
        title: '保存失败',
        description: error?.message || '保存失败',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [fetchSettings, role, toast, userId]);

  return (
    <div style={style} className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleBackToMain}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">签名配置</h1>
              <p className="text-sm text-gray-500">设置检验员/审核员签名工号</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AntdTag label={getUserTypeLabel(currentUser.type)} color="sky" showDot={false} />
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              当前配置
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border bg-gray-50 p-4">
                  <div className="text-sm text-gray-600">检验员工号</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{settings?.inspectionUserId || '-'}</div>
                </div>
                <div className="rounded-md border bg-gray-50 p-4">
                  <div className="text-sm text-gray-600">审核员工号</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{settings?.auditUserId || '-'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>更改签名工号</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">角色</div>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSPECTION">检验员</SelectItem>
                    <SelectItem value="AUDIT">审核员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">工号</div>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="请输入工号" />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
