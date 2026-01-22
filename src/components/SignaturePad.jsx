import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { X, PenTool, Loader2 } from 'lucide-react';

/**
 * 签名板组件
 * @param {boolean} isOpen - 是否显示
 * @param {() => void} onClose - 关闭回调
 * @param {(signatureData: string) => Promise<void>} onConfirm - 确认回调，返回签名数据
 * @param {boolean} signing - 是否正在签名/处理中
 */
export function SignaturePad({ isOpen, onClose, onConfirm, signing = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 初始化画布
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  // 开始绘制
  const startDrawing = useCallback((e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  // 绘制
  const draw = useCallback((e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  // 停止绘制
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // 清除签名
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // 检查画布是否为空
  const isCanvasEmpty = useCallback((canvas) => {
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 0) return false;
    }
    return true;
  }, []);

  // 确认签名
  const handleConfirm = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || isCanvasEmpty(canvas)) {
      return;
    }

    try {
      // 将画布转换为 base64 字符串
      const signatureData = canvas.toDataURL('image/png');
      await onConfirm(signatureData);
      clearSignature();
    } catch (error) {
      console.error(`【签名】签名确认失败, signing=${signing === true}`,
        error);
    }
  }, [onConfirm, clearSignature, isCanvasEmpty, signing]);

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            电子签名确认
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 签名板 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请在下方区域签名
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="mt-2 flex justify-between">
                <span className="text-sm text-gray-500">请在上方区域签名</span>
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  清除签名
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={signing}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={signing} className="bg-green-600 hover:bg-green-700">
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <PenTool className="w-4 h-4 mr-2" />
                确认签名
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}