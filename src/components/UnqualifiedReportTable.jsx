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
                reports.length > 0 &&
                reports.every((report) => selectedReports.includes(report.id))
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
          <React.Fragment key={report.id}>
            <TableRow className="hover:bg-gray-50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report.id)}
                  onChange={() => onSelectReport(report.id)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell className="font-medium">{report.columnSn}</TableCell>
              <TableCell>{report.workOrder}</TableCell>
              <TableCell>{report.orderNumber}</TableCell>
              <TableCell>{report.instrumentSerial}</TableCell>
              <TableCell>
                <Badge variant={report.testType === '糖化模式' ? 'default' : 'secondary'}>
                  {report.testType}
                </Badge>
              </TableCell>
              <TableCell>{report.testDate}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XCircle className="w-3 h-3 mr-1" />
                  {report.testResult}
                </Badge>
              </TableCell>
              <TableCell>{report.submitTime}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleExpand(report.id)}
                    className="h-8 w-8 p-0"
                    title="展开详情"
                  >
                    {expandedRows.includes(report.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPreview(report.id)}
                    className="h-8 w-8 p-0"
                    title="预览详情"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* 展开的检测数据行 */}
            {expandedRows.includes(report.id) && (
              <TableRow>
                <TableCell colSpan={10} className="bg-gray-50 p-4">
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
