// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
// @ts-ignore;
import { Pencil } from 'lucide-react';
import { ModeTag } from '@/components/AntdTag.jsx';

export function UnqualifiedReportTable({
  reports,
  selectedReports,
  onSelectReport,
  onSelectAll,
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
          <TableHead>预处理柱编号</TableHead>
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
                <ModeTag mode={report.mode} />
              </TableCell>
              <TableCell>{report.preprocessColumnSn || '-'}</TableCell>
              <TableCell>{report.inspectionDate || '-'}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit && onEdit(report.columnSn)}
                    className="h-8 w-8 p-0"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
