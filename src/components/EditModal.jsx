// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { X, Save, Edit2, Thermometer, Gauge, Timer, Activity, AlertTriangle, Calculator, RefreshCw } from 'lucide-react';

export function EditModal({
  isOpen,
  onClose,
  report,
  onSave,
  saving
}) {
  const [editedReport, setEditedReport] = useState(report || {});
  const [activeTab, setActiveTab] = useState('detection'); // 默认显示检测数据标签页

  // 如果报告数据变化，更新编辑状态
  useEffect(() => {
    if (report) {
      setEditedReport({
        ...report,
        // 深拷贝检测数据以避免直接修改原数据
        detectionData: JSON.parse(JSON.stringify(report.detectionData || {}))
      });
    }
  }, [report]);

  // 更新基本信息 - 禁用修改
  const updateBasicInfo = (field, value) => {
    // 基本信息不允许修改，直接返回
    return;
  };

  // 更新检测数据
  const updateDetectionData = (key, field, value) => {
    setEditedReport(prev => ({
      ...prev,
      detectionData: {
        ...prev.detectionData,
        [key]: {
          ...prev.detectionData[key],
          [field]: value
        }
      }
    }));
  };

  // 更新重复性测试的原始测值
  const updateRepeatabilityValues = (category, index, value) => {
    const currentData = editedReport.detectionData?.repeatabilityTest || {};
    const currentValues = {
      ...currentData.rawValues
    };
    if (!currentValues[category]) {
      currentValues[category] = [];
    }
    const newCategoryValues = [...currentValues[category]];
    newCategoryValues[index] = value;
    currentValues[category] = newCategoryValues;

    // 重新计算CV值
    const cvValue = calculateCV(currentValues);
    const conclusion = cvValue <= parseFloat(currentData.standard?.replace(/[^0-9.]/g, '') || 1.5) ? 'pass' : 'fail';
    updateDetectionData('repeatabilityTest', 'rawValues', currentValues);
    updateDetectionData('repeatabilityTest', 'result', `${cvValue.toFixed(2)}%`);
    updateDetectionData('repeatabilityTest', 'conclusion', conclusion);
  };

  // 计算CV值（变异系数）- 支持多分类测值
  const calculateCV = rawValues => {
    const allValues = [];

    // 将所有分类的测值合并计算
    Object.values(rawValues).forEach(categoryValues => {
      if (Array.isArray(categoryValues)) {
        categoryValues.forEach(value => {
          if (value && !isNaN(parseFloat(value))) {
            allValues.push(parseFloat(value));
          }
        });
      }
    });
    if (allValues.length < 2) return 0;
    const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
    const standardDeviation = Math.sqrt(variance);
    const cv = standardDeviation / mean * 100;
    return cv;
  };

  // 重新计算所有检测数据
  const recalculateAll = () => {
    const detectionData = editedReport.detectionData || {};

    // 重新计算重复性测试
    if (detectionData.repeatabilityTest?.rawValues) {
      const cvValue = calculateCV(detectionData.repeatabilityTest.rawValues);
      const standardValue = parseFloat(detectionData.repeatabilityTest.standard?.replace(/[^0-9.]/g, '') || 1.5);
      const conclusion = cvValue <= standardValue ? 'pass' : 'fail';
      updateDetectionData('repeatabilityTest', 'result', `${cvValue.toFixed(2)}%`);
      updateDetectionData('repeatabilityTest', 'conclusion', conclusion);
    }
  };

  // 获取检测项目图标
  const getDetectionIcon = iconName => {
    const iconMap = {
      Thermometer,
      Gauge,
      Timer,
      Activity
    };
    const IconComponent = iconMap[iconName] || AlertTriangle;
    return <IconComponent className="w-5 h-5" />;
  };

  // 保存编辑
  const handleSave = () => {
    if (onSave) {
      onSave(editedReport);
    }
  };

  // 过滤掉外观检查
  const getFilteredDetectionData = () => {
    const data = editedReport.detectionData || {};
    const {
      appearanceInspection,
      ...filteredData
    } = data;
    return filteredData;
  };

  // 获取重复性测值的分类信息
  const getRepeatabilityCategories = () => {
    const currentData = editedReport.detectionData?.repeatabilityTest || {};
    const rawValues = currentData.rawValues || {};

    // 如果rawValues是数组，说明是旧格式，转换为糖化模式格式
    if (Array.isArray(rawValues)) {
      return {
        '糖化模式': rawValues
      };
    }

    // 如果是对象，返回分类格式
    return rawValues;
  };

  // 获取所有测值的总数
  const getTotalValuesCount = () => {
    const categories = getRepeatabilityCategories();
    let totalCount = 0;
    Object.values(categories).forEach(values => {
      if (Array.isArray(values)) {
        totalCount += values.length;
      }
    });
    return totalCount;
  };

  // 获取所有测值的平均值
  const getAllValuesAverage = () => {
    const categories = getRepeatabilityCategories();
    const allValues = [];
    Object.values(categories).forEach(values => {
      if (Array.isArray(values)) {
        values.forEach(value => {
          if (value && !isNaN(parseFloat(value))) {
            allValues.push(parseFloat(value));
          }
        });
      }
    });
    if (allValues.length === 0) return 0;
    const sum = allValues.reduce((acc, val) => acc + val, 0);
    return (sum / allValues.length).toFixed(2);
  };
  if (!isOpen || !editedReport) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            编辑不合格报告 - {editedReport.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 标签页导航 */}
          <div className="flex space-x-1 border-b">
            <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('basic')}>
              基本信息
            </button>
            <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'detection' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('detection')}>
              检测数据
            </button>
            <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'conclusion' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('conclusion')}>
              结论与备注
            </button>
          </div>

          {/* 基本信息标签页 - 禁用修改 */}
          {activeTab === 'basic' && <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">基本信息不可修改</span>
                </div>
                <p className="text-sm text-gray-600">层析柱的基本信息（工单号、序列号、检测模式等）为系统自动生成，不允许手动修改。如需修改，请联系系统管理员。</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工单号</label>
                  <Input value={editedReport.workOrder || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="请输入工单号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">层析柱序列号</label>
                  <Input value={editedReport.columnSn || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="请输入层析柱序列号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">订单号</label>
                  <Input value={editedReport.orderNumber || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="请输入订单号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">仪器序列号</label>
                  <Input value={editedReport.instrumentSerial || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="请输入仪器序列号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">检测模式</label>
                  <Select value={editedReport.testType || ''} disabled>
                    <SelectTrigger className="bg-gray-100 text-gray-500 cursor-not-allowed">
                      <SelectValue placeholder="选择检测模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="糖化模式">糖化模式</SelectItem>
                      <SelectItem value="地贫模式">地贫模式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">报告类型</label>
                  <Select value={editedReport.reportType || ''} disabled>
                    <SelectTrigger className="bg-gray-100 text-gray-500 cursor-not-allowed">
                      <SelectValue placeholder="选择报告类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="glycation">糖化模式报告</SelectItem>
                      <SelectItem value="thalassemia">地贫模式报告</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                  <Input value={editedReport.operator || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="请输入负责人" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">报告日期</label>
                  <Input type="date" value={editedReport.testDate || ''} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>}

          {/* 检测数据标签页 - 允许修改 */}
          {activeTab === 'detection' && <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={recalculateAll} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  重新计算CV值
                </Button>
              </div>
              
              {Object.entries(getFilteredDetectionData()).map(([key, data]) => <Card key={key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getDetectionIcon(data.icon)}
                      {key === 'setTemperature' && '设定温度'}
                      {key === 'pressure' && '压力'}
                      {key === 'peakTime' && '出峰时间'}
                      {key === 'repeatabilityTest' && '重复性测试'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">标准值</label>
                        <Input value={data.standard || ''} onChange={e => updateDetectionData(key, 'standard', e.target.value)} placeholder="请输入标准值" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">检测结果</label>
                        <Input value={data.result || ''} onChange={e => updateDetectionData(key, 'result', e.target.value)} placeholder="请输入检测结果" />
                      </div>
                    </div>
                    
                    {/* 重复性测试的特殊处理 */}
                    {key === 'repeatabilityTest' && <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            层析柱重复性测值
                          </label>
                          <div className="space-y-4">
                            {Object.entries(getRepeatabilityCategories()).map(([category, values]) => <div key={category} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">{category} ({values.length}个测值)</h4>
                                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                                  {values.map((value, index) => <div key={index} className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500 w-8">{index + 1}.</span>
                                      <Input type="number" step="0.01" value={value} onChange={e => updateRepeatabilityValues(category, index, e.target.value)} placeholder="测值" className="flex-1 h-8 text-sm" />
                                    </div>)}
                                </div>
                              </div>)}
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>计算说明：</strong>CV值（变异系数）= 标准差 / 平均值 × 100%
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            当前测值总数：{getTotalValuesCount()} 个
                          </p>
                          <p className="text-sm text-blue-600">
                            平均值：{getAllValuesAverage()}
                          </p>
                        </div>
                      </div>}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结论</label>
                      <Select value={data.conclusion || ''} onValueChange={value => updateDetectionData(key, 'conclusion', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择结论" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">合格</SelectItem>
                          <SelectItem value="fail">不合格</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={data.conclusion === 'pass' ? 'default' : 'destructive'}>
                        {data.conclusion === 'pass' ? '合格' : '不合格'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        标准: {data.standard} | 结果: {data.result}
                      </span>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* 结论与备注标签页 - 允许修改 */}
          {activeTab === 'conclusion' && <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">检测结果</label>
                <Select value={editedReport.testResult || ''} onValueChange={value => updateBasicInfo('testResult', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择检测结果" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualified">合格</SelectItem>
                    <SelectItem value="unqualified">不合格</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">不合格原因</label>
                <Input value={editedReport.unqualifiedReasons?.join(', ') || ''} onChange={e => updateBasicInfo('unqualifiedReasons', e.target.value.split(',').map(r => r.trim()))} placeholder="请输入不合格原因，多个原因用逗号分隔" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">审核状态</label>
                <Select value={editedReport.auditStatus || ''} onValueChange={value => updateBasicInfo('auditStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择审核状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea className="w-full p-2 border border-gray-300 rounded-md resize-vertical" rows={4} value={editedReport.remarks || ''} onChange={e => updateBasicInfo('remarks', e.target.value)} placeholder="请输入备注信息" />
              </div>
            </div>}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </> : <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}