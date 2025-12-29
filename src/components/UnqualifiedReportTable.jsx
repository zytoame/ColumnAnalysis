// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
// @ts-ignore;
import { Eye, ChevronDown, ChevronUp, Download, XCircle } from 'lucide-react';
// @ts-ignore;
import { DetectionDataCard } from '@/components/DetectionDataCard.jsx';

export function UnqualifiedReportTable({
  reports,
  selectedReports,
  expandedRows,
  onSelectReport,
  onSelectAll,
  onToggleExpand,
  onEdit,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={
                reports.length > 0 &&
                reports.every((report) => selectedReports.includes(report.columnSn))
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
        {reports.map((report) => (
          <React.Fragment key={report.columnSn}>
            <TableRow className="hover:bg-gray-50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report.columnSn)}
                  onChange={() => onSelectReport(report.columnSn)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell className="font-medium">{report.columnSn}</TableCell>
              <TableCell>{report.sapWorkOrderNo}</TableCell>
              <TableCell>{report.sapOrderNo}</TableCell>
              <TableCell>{report.deviceSn}</TableCell>
              <TableCell>
                <Badge variant={report.mode === '糖化模式' ? 'default' : 'secondary'}>
                  {report.mode}
                </Badge>
              </TableCell>
              <TableCell>{report.preprocessColumnSn || '-'}</TableCell>
              <TableCell>{report.inspectionDate || '-'}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleExpand(report.columnSn)}
                    className="h-8 w-8 p-0"
                    title="展开详情"
                  >
                    {expandedRows.includes(report.columnSn) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit && onEdit(report.columnSn)}
                    className="h-8 w-8 p-0"
                    title="编辑"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* 展开的检测数据行 */}
            {expandedRows.includes(report.columnSn) && (
              <TableRow>
                <TableCell colSpan={9} className="bg-gray-50 p-4">
                  <DetectionDataCard
                    detectionData={report.detectionData || {}}
                    finalConclusion={report.finalConclusion || 'unqualified'}
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
