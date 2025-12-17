// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
// @ts-ignore;
import { Eye, ChevronDown, ChevronUp, Download } from 'lucide-react';
// @ts-ignore;
import { DetectionDataCard } from '@/components/DetectionDataCard.jsx';

export function ReportTable({
  reports,
  selectedReports,
  expandedRows,
  onSelectReport,
  onSelectAll,
  onToggleExpand,
  onPreview,
  onDownload,
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
          <TableHead>层析柱名称</TableHead>
          <TableHead>检测模式</TableHead>
          <TableHead>负责人</TableHead>
          <TableHead>提交时间</TableHead>
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
              <TableCell>
                <div className="max-w-32">
                  <div className="truncate" title={report.columnName}>
                    {report.columnName}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={report.testType === '糖化模式' ? 'default' : 'secondary'}>
                  {report.testType}
                </Badge>
              </TableCell>
              <TableCell>{report.operator}</TableCell>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(report.id)}
                    className="h-8 w-8 p-0"
                    title="下载报告"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* 展开的检测数据行 */}
            {expandedRows.includes(report.id) && (
              <TableRow>
                <TableCell colSpan={8} className="bg-gray-50 p-4">
                  <DetectionDataCard
                    detectionData={report.detectionData || {}}
                    finalConclusion={report.finalConclusion}
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
