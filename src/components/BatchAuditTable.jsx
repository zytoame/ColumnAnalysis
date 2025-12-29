// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
// @ts-ignore;
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
// @ts-ignore;
import { DetectionDataCard } from '@/components/DetectionDataCard.jsx';

export function BatchAuditTable({
  columns,
  selectedColumns,
  expandedRows,
  onSelectColumn,
  onSelectAll,
  onToggleExpand,
  onPreview,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={
                columns.length > 0 &&
                columns.every((column) => selectedColumns.includes(column.columnSn))
              }
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300"
            />
          </TableHead>
          <TableHead>层析柱序列号</TableHead>
          <TableHead>工单号</TableHead>
          <TableHead>订单号</TableHead>
          <TableHead>仪器序列号</TableHead>
          <TableHead>检测模式</TableHead>
          <TableHead>成品序列号</TableHead>
          <TableHead>检测日期</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {columns.map((column) => (
          <React.Fragment key={column.columnSn}>
            <TableRow className="hover:bg-gray-50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.columnSn)}
                  onChange={() => onSelectColumn(column.columnSn)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell className="font-medium">{column.columnSn}</TableCell>
              <TableCell>{column.sapWorkOrderNo}</TableCell>
              <TableCell>{column.sapOrderNo}</TableCell>
              <TableCell>{column.deviceSn}</TableCell>
              <TableCell>
                <Badge variant={column.mode === '糖化模式' ? 'default' : 'secondary'}>
                  {column.mode}
                </Badge>
              </TableCell>
              <TableCell>{column.preprocessColumnSn || '-'}</TableCell>
              <TableCell>{column.inspectionDate || '-'}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleExpand(column.columnSn)}
                    className="h-8 w-8 p-0"
                    title="展开详情"
                  >
                    {expandedRows.includes(column.columnSn) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPreview(column.columnSn)}
                    className="h-8 w-8 p-0"
                    title="预览详情"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* 展开的检测数据行 */}
            {expandedRows.includes(column.columnSn) && (
              <TableRow>
                <TableCell colSpan={8} className="bg-gray-50 p-4">
                  <DetectionDataCard
                    detectionData={column.detectionData || {}}
                    finalConclusion={column.finalConclusion}
                    defaultExpanded={true}
                    showHeader={false}
                  />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
