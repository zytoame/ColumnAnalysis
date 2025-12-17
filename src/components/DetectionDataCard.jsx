// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@/components/ui';
// @ts-ignore;
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Gauge,
  Timer,
  Package,
} from 'lucide-react';

/**
 * 通用检测数据展示卡片
 *
 * - detectionData: 后端/页面传入的检测数据对象
 * - finalConclusion: 最终结论（qualified / unqualified），用于显示顶部标签
 * - defaultExpanded: 初始是否展开明细
 * - showHeader: 是否显示标题和折叠按钮（在表格展开行中也可以复用）
 */
export const DetectionDataCard = ({
  detectionData,
  finalConclusion,
  defaultExpanded = false,
  showHeader = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getConclusionBadge = (conclusion) => {
    return conclusion === 'pass' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        合格
      </Badge>
    ) : (
      <Badge variant="destructive">不合格</Badge>
    );
  };

  const getFinalConclusionBadge = (conclusion) => {
    // 默认视为不合格，保证组件在缺少字段时也有明确展示
    return conclusion === 'qualified' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        最终合格
      </Badge>
    ) : (
      <Badge variant="destructive">最终不合格</Badge>
    );
  };

  // 将字符串 icon 名称映射到具体图标组件，兼容不同数据格式
  const resolveIcon = (iconValue) => {
    if (!iconValue) return null;

    if (typeof iconValue === 'string') {
      const map = {
        Thermometer,
        Gauge,
        Timer,
        Package,
      };
      return map[iconValue] || Activity;
    }

    // 直接是 React 组件的情况
    return iconValue;
  };

  const renderItemLabel = (key) => {
    // 兼容不同字段命名：moduleTemperature / setTemperature 等
    if (key === 'setTemperature') return '模块温度';
    if (key === 'pressure') return '系统压力';
    if (key === 'hbA1cAppearanceTime' || key === 'peakTime') return 'HbA1c出峰时间';
    if (key === 'repeatabilityTest') return '重复性测试';
    if (key === 'appearanceInspection') return '外观检查';
    return key;
  };

  if (!detectionData || Object.keys(detectionData).length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              检测数据详情
            </CardTitle>
            <div className="flex items-center gap-2">
              {getFinalConclusionBadge(finalConclusion)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      {(!showHeader || isExpanded) && (
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">图标</TableHead>
                  <TableHead>检测项目</TableHead>
                  <TableHead>标准值</TableHead>
                  <TableHead>检测结果</TableHead>
                  <TableHead>结论</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(detectionData).map(([key, data]) => {
                  const IconComponent = resolveIcon(data.icon);
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        {IconComponent && (
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {renderItemLabel(key)}
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600 font-medium">
                          {data.standard}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            data.conclusion === 'pass'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {data.result}
                        </span>
                      </TableCell>
                      <TableCell>{getConclusionBadge(data.conclusion)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
