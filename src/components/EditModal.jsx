// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from '@/components/ui';
// @ts-ignore;
import { X, Save, Edit2, Thermometer, Gauge, Timer, Activity, AlertTriangle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { AntdTag } from '@/components/AntdTag.jsx';
import columnApi from '@/api/column';

export function EditModal({
  isOpen,
  onClose,
  report,
  onSave,
  saving
}) {
  const { toast } = useToast();
  const [editedReport, setEditedReport] = useState(report || {});
  const [activeTab, setActiveTab] = useState('detection'); // 默认显示检测数据标签页

  const baselineRef = useRef(null);

  // 如果报告数据变化，更新编辑状态
  useEffect(() => {
    if (report) {
      setEditedReport(() => {
        const next = {
          ...report,
          // 深拷贝检测数据以避免直接修改原数据
          detectionData: JSON.parse(JSON.stringify(report.detectionData || {}))
        };
        baselineRef.current = JSON.parse(JSON.stringify(next));
        return next;
      });
    }
  }, [report]);

  const normalizeFieldPath = (p) => {
    if (!p) return '';
    return String(p).replace(/^detectionData\./, '');
  };

  const buildFinalChangeLogs = (baseline, current) => {
    const now = new Date().toISOString();
    const logs = [];

    const bDet = baseline?.detectionData || {};
    const cDet = current?.detectionData || {};

    const push = (fieldPath, oldValue, newValue) => {
      const oldStr = oldValue == null ? '' : String(oldValue);
      const newStr = newValue == null ? '' : String(newValue);
      if (oldStr === newStr) return;
      const normalized = normalizeFieldPath(fieldPath);
      const source = /(\.conclusion$)|(repeatabilityTest\.result$)|(repeatabilityTest\.conclusion$)/.test(normalized)
        ? 'auto'
        : 'user';
      logs.push({
        fieldPath: normalized,
        oldValue: oldStr,
        newValue: newStr,
        source,
        changedAt: now,
      });
    };

    const keys = new Set([...Object.keys(bDet), ...Object.keys(cDet)]);
    keys.forEach((key) => {
      const bItem = bDet?.[key] || {};
      const cItem = cDet?.[key] || {};

      // 重复性原始测值：逐项对比
      if (key === 'repeatabilityTest') {
        const bRaw = bItem?.rawValues || {};
        const cRaw = cItem?.rawValues || {};

        const bObj = Array.isArray(bRaw) ? { '糖化模式': bRaw } : bRaw;
        const cObj = Array.isArray(cRaw) ? { '糖化模式': cRaw } : cRaw;
        const cats = new Set([...Object.keys(bObj || {}), ...Object.keys(cObj || {})]);
        cats.forEach((cat) => {
          const bArr = Array.isArray(bObj?.[cat]) ? bObj[cat] : [];
          const cArr = Array.isArray(cObj?.[cat]) ? cObj[cat] : [];
          const max = Math.max(bArr.length, cArr.length);
          for (let i = 0; i < max; i++) {
            push(`detectionData.repeatabilityTest.rawValues.${cat}[${i}]`, bArr[i], cArr[i]);
          }
        });

        // repeatabilityTest 本身的字段
        ['standard', 'result', 'conclusion'].forEach((f) => {
          push(`detectionData.repeatabilityTest.${f}`, bItem?.[f], cItem?.[f]);
        });
        return;
      }

      // 常规检测项
      ['standard', 'result', 'conclusion'].forEach((f) => {
        if (bItem?.[f] === undefined && cItem?.[f] === undefined) return;
        push(`detectionData.${key}.${f}`, bItem?.[f], cItem?.[f]);
      });
    });

    return logs;
  };

  const parseNumber = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const s = String(v).trim();
    if (!s) return null;
    const num = parseFloat(s.replace(/[^0-9.+-]/g, ''));
    return Number.isFinite(num) ? num : null;
  };

  const parseRangeStandard = (standardText) => {
    if (!standardText) return { min: null, max: null };
    const s = String(standardText).trim();
    const rangeMatch = s.match(/(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    const gteMatch = s.match(/>=\s*(-?\d+(?:\.\d+)?)/);
    if (gteMatch) return { min: parseFloat(gteMatch[1]), max: null };
    const lteMatch = s.match(/<=\s*(-?\d+(?:\.\d+)?)/);
    if (lteMatch) return { min: null, max: parseFloat(lteMatch[1]) };
    return { min: null, max: null };
  };

  const computeConclusionByStandard = (standardText, resultText) => {
    const result = parseNumber(resultText);
    if (result == null) return 'fail';

    const { min, max } = parseRangeStandard(standardText);
    if (min == null && max == null) return 'fail';
    if (min != null && result < min) return 'fail';
    if (max != null && result > max) return 'fail';
    return 'pass';
  };

  useEffect(() => {
    let cancelled = false;
    const columnSn = report?.columnSn;
    if (!isOpen || !columnSn) return;

    (async () => {
      try {
        const response = await columnApi.getRepeatabilityData(columnSn);
        const body = response?.data;
        const raw = body?.data ?? null;
        if (!body?.success || raw == null) {
          throw new Error(body?.errorMsg || '未获取到重复性测值');
        }

        const normalized = {};

        // 兼容返回：{ type: [..] } 或 { type: "[..]" }
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          Object.entries(raw).forEach(([k, arr]) => {
            if (Array.isArray(arr)) {
              normalized[k] = arr.map((v) => (v == null ? '' : String(v)));
              return;
            }
            if (typeof arr === 'string') {
              try {
                const parsed = JSON.parse(arr);
                if (Array.isArray(parsed)) {
                  normalized[k] = parsed.map((v) => (v == null ? '' : String(v)));
                }
              } catch (e) {
                // ignore
              }
            }
          });
        }

        // 兼容返回：[{ type, testValue }] 或 [{ type, values }]
        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            const type = item?.type;
            if (!type || normalized[type]) return;
            const values = item?.values;
            const testValue = item?.testValue;

            if (Array.isArray(values)) {
              normalized[type] = values.map((v) => (v == null ? '' : String(v)));
              return;
            }

            if (typeof testValue === 'string') {
              try {
                const parsed = JSON.parse(testValue);
                if (Array.isArray(parsed)) {
                  normalized[type] = parsed.map((v) => (v == null ? '' : String(v)));
                }
              } catch (e) {
                // ignore
              }
            }
          });
        }

        if (Object.keys(normalized).length === 0) {
          toast({
            title: '未加载到重复性测值',
            description: '数据库未返回该层析柱的重复性测值（或返回格式不匹配）',
            variant: 'destructive',
          });
        }

        if (cancelled) return;
        setEditedReport((prev) => {
          const detectionData = prev?.detectionData || {};
          const repeatabilityTest = detectionData?.repeatabilityTest || {};
          const next = {
            ...prev,
            detectionData: {
              ...detectionData,
              repeatabilityTest: {
                ...repeatabilityTest,
                rawValues: normalized,
              },
            },
          };
          baselineRef.current = JSON.parse(JSON.stringify(next));
          return next;
        });
      } catch (e) {
        if (cancelled) return;
        toast({
          title: '加载重复性测值失败',
          description: e instanceof Error ? e.message : '无法加载重复性测值',
          variant: 'destructive',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, report?.columnSn]);

  useEffect(() => {
    if (!isOpen) return;
    const rawValues = editedReport?.detectionData?.repeatabilityTest?.rawValues;
    if (!rawValues) return;
    const cvValue = calculateCV(rawValues);
    if (!Number.isFinite(cvValue)) return;
    const standardValue = parseFloat(
      editedReport?.detectionData?.repeatabilityTest?.standard?.replace(/[^0-9.]/g, '') || 1.5
    );
    const conclusion = cvValue <= standardValue ? 'pass' : 'fail';
    const nextCv = `${cvValue.toFixed(2)}%`;
    setEditedReport((prev) => {
      const prevCv = prev?.detectionData?.repeatabilityTest?.result;
      const prevConclusion = prev?.detectionData?.repeatabilityTest?.conclusion;
      return {
        ...prev,
        detectionData: {
          ...prev.detectionData,
          repeatabilityTest: {
            ...(prev.detectionData?.repeatabilityTest || {}),
            result: nextCv,
            conclusion,
          },
        },
      };
    });
  }, [editedReport?.detectionData?.repeatabilityTest?.rawValues, editedReport?.detectionData?.repeatabilityTest?.standard, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const detectionData = editedReport?.detectionData || {};
    Object.entries(detectionData).forEach(([key, data]) => {
      if (!data) return;
      if (key === 'repeatabilityTest') return;
      const nextConclusion = computeConclusionByStandard(data.standard, data.result);
      if (data.conclusion !== nextConclusion) {
        setEditedReport((prev) => {
          return {
            ...prev,
            detectionData: {
              ...prev.detectionData,
              [key]: {
                ...(prev.detectionData?.[key] || {}),
                conclusion: nextConclusion,
              },
            },
          };
        });
      }
    });
  }, [editedReport?.detectionData, isOpen]);

  // 更新检测数据
  const updateDetectionData = (key, field, value) => {
    setEditedReport((prev) => {
      const prevVal = prev?.detectionData?.[key]?.[field];
      return {
        ...prev,
        detectionData: {
          ...prev.detectionData,
          [key]: {
            ...prev.detectionData[key],
            [field]: value
          }
        }
      };
    });
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
    const prevValue = newCategoryValues[index];
    newCategoryValues[index] = value;
    currentValues[category] = newCategoryValues;

    // 只更新rawValues，不重新计算CV和结论
    setEditedReport((prev) => {
      return {
        ...prev,
        detectionData: {
          ...prev.detectionData,
          repeatabilityTest: {
            ...(prev.detectionData?.repeatabilityTest || {}),
            rawValues: currentValues,
          },
        },
      };
    });
  };

  // TODO计算CV值（变异系数）- 支持多分类测值，  
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

  const getConclusionUI = (conclusion) => {
    const isPass = conclusion === 'pass';
    return {
      label: isPass ? '合格' : '不合格',
      Icon: isPass ? CheckCircle2 : XCircle,
      color: isPass ? 'green' : 'red',
      iconClassName: isPass ? 'w-3 h-3 mr-1 text-green-600' : 'w-3 h-3 mr-1 text-red-600',
    };
  };

  // 保存编辑
  const handleSave = () => {
    if (onSave) {
      const baseline = baselineRef.current || report || {};
      const finalChangeLogs = buildFinalChangeLogs(baseline, editedReport);
      onSave({
        ...editedReport,
        changeLogs: finalChangeLogs,
      });
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
            <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'detection' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('detection')}>
              检测数据
            </button>
          </div>

          {/* 检测数据标签页 - 允许修改 */}
          {activeTab === 'detection' && <div className="space-y-4">
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
                        <Input
                          value={data.result || ''}
                          onChange={e => updateDetectionData(key, 'result', e.target.value)}
                          placeholder="请输入检测结果"
                          disabled={key === 'repeatabilityTest'}
                          className={key === 'repeatabilityTest' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : undefined}
                        />
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
                      <Select value={data.conclusion || ''} disabled>
                        <SelectTrigger className="bg-gray-100 text-gray-500 cursor-not-allowed">
                          <SelectValue placeholder="选择结论" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">合格</SelectItem>
                          <SelectItem value="fail">不合格</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const ui = getConclusionUI(data.conclusion);
                        return (
                          <AntdTag
                            label={ui.label}
                            color={ui.color}
                            showDot={false}
                            prefix={<ui.Icon className={ui.iconClassName} />}
                          />
                        );
                      })()}
                      <span className="text-sm text-gray-500">
                        标准: {data.standard} | 结果: {data.result}
                      </span>
                    </div>
                  </CardContent>
                </Card>)}
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