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
    <Table className="w-full table-fixed min-w-[1120px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">
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
          <TableHead className="w-40 text-center whitespace-nowrap">自编序列号</TableHead>
          <TableHead className="w-40 text-center whitespace-nowrap">成品序列号</TableHead>
          <TableHead className="w-28 text-center whitespace-nowrap">工单号</TableHead>
          <TableHead className="w-32 text-center whitespace-nowrap">仪器序列号</TableHead>
          <TableHead className="w-20 text-center whitespace-nowrap">检测模式</TableHead>
          <TableHead className="w-28 text-center whitespace-nowrap">检测日期</TableHead>
          <TableHead className="text-center min-w-[320px]">建议</TableHead>
          <TableHead className="w-20 text-center whitespace-nowrap">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <React.Fragment key={report.columnSn}>
            <TableRow className="hover:bg-secondary">
              <TableCell className="py-3 text-center align-middle">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report.columnSn)}
                  onChange={() => onSelectReport(report.columnSn)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell className="py-3 text-center align-middle font-medium truncate whitespace-nowrap" title={report.columnSn || ''}>
                {report.columnSn}
              </TableCell>
              <TableCell
                className="py-3 text-center align-middle font-medium truncate whitespace-nowrap"
                title={report.productSn || ''}
              >
                {report.productSn || '-'}
              </TableCell>
              <TableCell className="py-3 text-center align-middle truncate whitespace-nowrap" title={report.aufnr || ''}>
                {report.aufnr}
              </TableCell>
              <TableCell className="py-3 text-center align-middle truncate whitespace-nowrap" title={report.deviceSn || ''}>
                {report.deviceSn}
              </TableCell>
              <TableCell className="py-3 text-center align-middle">
                <div className="flex items-center justify-center">
                  <ModeTag mode={report.mode} />
                </div>
              </TableCell>
              <TableCell className="py-3 text-center align-middle truncate whitespace-nowrap" title={report.inspectionDate || ''}>
                {report.inspectionDate || '-'}
              </TableCell>
              <TableCell
                className="py-3 text-center align-middle whitespace-normal break-words text-sm leading-5"
                title={report.suggestion || ''}
              >
                {report.suggestion || '-'}
              </TableCell>
              <TableCell className="py-3 text-center align-middle">
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
