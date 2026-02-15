import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenTool } from 'lucide-react';
import signatureSettingsApi from '@/api/signatureSettings';
import { SignaturePad } from '@/components/SignaturePad.jsx';
import { showErrorToast } from '@/utils/toast';

export default function SignatureSettingsPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const [uploadingEnRole, setUploadingEnRole] = useState('');

  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [signaturePadRole, setSignaturePadRole] = useState('');
  const [signaturePadSigning, setSignaturePadSigning] = useState(false);

  const inspectionEnFileRef = useRef(null);
  const auditEnFileRef = useRef(null);

  const [role, setRole] = useState('INSPECTION');
  const [userId, setUserId] = useState('');

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
      showErrorToast(toast, { title: '获取失败', description: '获取签名配置失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUploadEnglishSignature = useCallback(async (targetRole, file) => {
    if (!targetRole) return;
    if (!file) return;
    if (file.type && file.type !== 'image/png') {
      toast({
        title: '文件格式不正确',
        description: '请上传白底或者透明底的PNG格式签名图片',
        variant: 'destructive',
      });
      return;
    }

    setUploadingEnRole(targetRole);
    try {
      const response = await signatureSettingsApi.uploadEnglishSignature(targetRole, file);
      const body = response?.data;
      if (!body?.success) {
        throw new Error(body?.errorMsg || '上传失败');
      }
      toast({
        title: '上传成功',
        description: `英文${targetRole === 'INSPECTION' ? '检验员' : '审核员'}签名已更新`,
      });
      await fetchSettings();
    } catch (error) {
      showErrorToast(toast, { title: '上传失败', description: '上传失败，请稍后重试' });
    } finally {
      setUploadingEnRole('');
      if (inspectionEnFileRef.current) inspectionEnFileRef.current.value = '';
      if (auditEnFileRef.current) auditEnFileRef.current.value = '';
    }
  }, [fetchSettings, toast]);

  const dataUrlToFile = useCallback((dataUrl, fileName) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('签名数据为空');
    }
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      throw new Error('签名数据格式不正确');
    }
    const header = parts[0];
    const base64 = parts[1];
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], fileName, { type: mime });
  }, []);

  const openSignaturePad = useCallback((targetRole) => {
    setSignaturePadRole(targetRole);
    setSignaturePadOpen(true);
  }, []);

  const handleSignaturePadConfirm = useCallback(async (signatureDataUrl) => {
    if (!signaturePadRole) return;
    setSignaturePadSigning(true);
    try {
      const file = dataUrlToFile(signatureDataUrl, `${signaturePadRole}_EN.png`);
      await handleUploadEnglishSignature(signaturePadRole, file);
      setSignaturePadOpen(false);
      setSignaturePadRole('');
    } catch (error) {
      showErrorToast(toast, { title: '签名保存失败', description: '签名保存失败，请稍后重试' });
    } finally {
      setSignaturePadSigning(false);
    }
  }, [dataUrlToFile, handleUploadEnglishSignature, signaturePadRole, toast]);

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
      showErrorToast(toast, { title: '保存失败', description: '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }, [fetchSettings, role, toast, userId]);

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">签名配置</h1>
          <div className="mt-1 text-sm text-slate-500">设置检验员/审核员签名</div>
        </div>
      </div>

      <div className="space-y-6">
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
                <div className="rounded-md border bg-secondary p-4">
                  <div className="text-sm text-gray-600">检验员工号</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{settings?.inspectionUserId || '-'}</div>
                </div>
                <div className="rounded-md border bg-secondary p-4">
                  <div className="text-sm text-gray-600">审核员工号</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{settings?.auditUserId || '-'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <SignaturePad
          isOpen={signaturePadOpen}
          onClose={() => {
            if (signaturePadSigning) return;
            setSignaturePadOpen(false);
            setSignaturePadRole('');
          }}
          onConfirm={handleSignaturePadConfirm}
          signing={signaturePadSigning}
        />

        <Card>
          <CardHeader>
            <CardTitle>更改英文签名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border bg-secondary p-4 space-y-3">
                <div>
                  <div className="text-sm text-gray-600">检验员英文签名</div>
                  <div className="mt-1 text-sm text-gray-900 break-all">
                    {settings?.inspectionSignatureKeyEn ? '已上传' : '未上传'}
                  </div>
                </div>
                <input
                  ref={inspectionEnFileRef}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleUploadEnglishSignature('INSPECTION', file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => inspectionEnFileRef.current?.click()}
                  disabled={uploadingEnRole === 'INSPECTION' || loading}
                >
                  {uploadingEnRole === 'INSPECTION' ? '上传中...' : '上传透明底或白底英文签名图片'}
                </Button>

                <Button
                  onClick={() => openSignaturePad('INSPECTION')}
                  disabled={uploadingEnRole === 'INSPECTION' || loading}
                >
                  手写检验员英文签名
                </Button>
              </div>

              <div className="rounded-md border bg-secondary p-4 space-y-3">
                <div>
                  <div className="text-sm text-gray-600">审核员英文签名</div>
                  <div className="mt-1 text-sm text-gray-900 break-all">
                    {settings?.auditSignatureKeyEn ? '已上传' : '未上传'}
                  </div>
                </div>
                <input
                  ref={auditEnFileRef}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleUploadEnglishSignature('AUDIT', file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => auditEnFileRef.current?.click()}
                  disabled={uploadingEnRole === 'AUDIT' || loading}
                >
                  {uploadingEnRole === 'AUDIT' ? '上传中...' : '上传透明底或者白底英文签名图片'}
                </Button>

                <Button
                  onClick={() => openSignaturePad('AUDIT')}
                  disabled={uploadingEnRole === 'AUDIT' || loading}
                >
                  手写审核员英文签名
                </Button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              <p>英文报告生成时会强制使用英文签名图片，未上传将直接报错。上传的图片需为白底或者透明底，否则会影响报告生成的最终效果。</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>更改中文签名</CardTitle>
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
