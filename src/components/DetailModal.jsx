// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
// @ts-ignore;
import { X, Eye, ChevronDown, ChevronUp, Thermometer, Gauge, Timer, Activity, Package, AlertTriangle, Clock, User, Calendar, FileText } from 'lucide-react';

export function DetailModal({
  column,
  isOpen,
  onClose
}) {
  const [expandedSections, setExpandedSections] = useState(new Set(['detectionData']));

  // 切换展开状态
  const toggleSection = section => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // 获取检测项目图标
  const getDetectionIcon = iconName => {
    const iconMap = {
      Thermometer,
      Gauge,
      Timer,
      Activity,
      Package
    };
    const IconComponent = iconMap[iconName] || AlertTriangle;
    return <IconComponent className="w-5 h-5" />;
  };

  // 获取状态标签
  const getStatusBadge = status => {
    const statusConfig = {
      qualified: {
        label: '合格',
        color: 'default'
      },
      unqualified: {
        label: '不合格',
        color: 'destructive'
      }
    };
    const config = statusConfig[status] || statusConfig.unqualified;
    return <Badge variant={config.color}>{config.label}</Badge>;
  };

  // 获取优先级标签
  const getPriorityBadge = priority => {
    const priorityConfig = {
      high: {
        label: '高',
        color: 'destructive'
      },
      medium: {
        label: '中',
        color: 'secondary'
      },
      low: {
        label: '低',
        color: 'outline'
      }
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge variant={config.color}>{config.label}</Badge>;
  };
  if (!isOpen || !column) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            报告详情 - {column.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  基本信息
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleSection('basic')}>
                  {expandedSections.has('basic') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('basic') && <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">报告编号</label>
                    <p className="font-medium">{column.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">工单号</label>
                    <p className="font-medium">{column.workOrder}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">层析柱序列号</label>
                    <p className="font-medium">{column.columnSn || column.columnSerial}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">订单号</label>
                    <p className="font-medium">{column.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">仪器序列号</label>
                    <p className="font-medium">{column.instrumentSerial}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">层析柱名称</label>
                    <p className="font-medium">{column.columnName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">检测类型</label>
                    <p className="font-medium">{column.testType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">检测日期</label>
                    <p className="font-medium">{column.testDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">操作员</label>
                    <p className="font-medium">{column.operator}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">提交时间</label>
                    <p className="font-medium">{column.submitTime}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">优先级</label>
                    <div>{getPriorityBadge(column.priority)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">最终结论</label>
                    <div>{getStatusBadge(column.finalConclusion)}</div>
                  </div>
                </div>
              </CardContent>}
          </Card>

          {/* 检测数据 */}
          {column.detectionData && <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    检测数据
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => toggleSection('detectionData')}>
                    {expandedSections.has('detectionData') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.has('detectionData') && <CardContent>
                  <div className="space-y-4">
                    {Object.entries(column.detectionData).map(([key, data]) => <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getDetectionIcon(data.icon)}
                            <h4 className="font-medium">
                              {key === 'moduleTemperature' && '模块温度'}
                              {key === 'systemPressure' && '系统压力'}
                              {key === 'hbA1cAppearanceTime' && 'HbA1c出现时间'}
                              {key === 'repeatabilityTest' && '重复性测试'}
                              {key === 'appearanceInspection' && '外观检查'}
                            </h4>
                          </div>
                          <Badge variant={data.conclusion === 'pass' ? 'default' : 'destructive'}>
                            {data.conclusion === 'pass' ? '合格' : '不合格'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">标准值：</span>
                            <span className="font-medium">{data.standard}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">检测结果：</span>
                            <span className="font-medium">{data.result}</span>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </CardContent>}
            </Card>}

          {/* 不合格原因 */}
          {column.不合格原因 && <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  不合格原因
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">{column.不合格原因}</p>
                </div>
              </CardContent>
            </Card>}

          {/* 操作历史 */}
          {column.operationHistory && column.operationHistory.length > 0 && <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    操作历史
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => toggleSection('operationHistory')}>
                    {expandedSections.has('operationHistory') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.has('operationHistory') && <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>操作人</TableHead>
                        <TableHead>操作</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {column.operationHistory.map((history, index) => <TableRow key={index}>
                          <TableCell>{history.time}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {history.operator}
                            </div>
                          </TableCell>
                          <TableCell>{history.action}</TableCell>
                          <TableCell>{history.remark}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>}
            </Card>}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}