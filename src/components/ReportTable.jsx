// @ts-ignore;
import React from 'react';
import { useAuth } from '@/auth/AuthProvider';
// @ts-ignore;
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Checkbox } from '@/components/ui';
// @ts-ignore;
import { Eye, ChevronDown, ChevronUp, Download, FileText, Trash2 } from 'lucide-react';
// @ts-ignore;
import { DetectionDataCard } from '@/components/DetectionDataCard.jsx';
import { ModeTag } from '@/components/AntdTag.jsx';

export const ReportTable = ({
  reports = [],
  selectedReports = [],
  onSelectReport,
  onSelectAll,
  onPreview,
  onGenerate,
  onDownload,
  onDelete,
}) => {
  const auth = useAuth();
  // 普通用户只允许预览/下载，不允许生成/删除
  const isCustomer = auth?.role === 'CUSTOMER';

  // 判断当前页是否全选
  const isAllSelected = reports.length > 0 &&
    reports.every((report) => selectedReports.includes(report.columnSn));
  const isSomeSelected = reports.some((report) => selectedReports.includes(report.columnSn));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => onSelectAll(checked === true)}
            />
          </TableHead>
          <TableHead>成品序列号</TableHead>
          <TableHead>工单号</TableHead>
          <TableHead>报告类型</TableHead>
          <TableHead>检测模式</TableHead>
          <TableHead>检测日期</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              暂无数据
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report) => (
          <React.Fragment key={report.columnSn}>
            <TableRow className="hover:bg-gray-50">
              <TableCell>
                <Checkbox
                  checked={selectedReports.includes(report.columnSn)}
                  onCheckedChange={() => onSelectReport(report.columnSn)}
                />
              </TableCell>
              <TableCell className="font-medium" title={report.productSn || ''}>
                {report.productSn || '-'}
              </TableCell>
              <TableCell title={report.aufnr || ''}>{report.aufnr}</TableCell>
              <TableCell title={report.reportType || ''}>{report.reportType}</TableCell>
              <TableCell>
                <ModeTag mode={report.mode} />
              </TableCell>
              <TableCell title={report.inspectionDate || ''}>{report.inspectionDate}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onPreview(report)}>
                    <Eye className="h-4 w-4 mr-1" /> 预览
                  </Button>
                  {!isCustomer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGenerate?.(report)}
                      disabled={!onGenerate}
                    >
                      <FileText className="h-4 w-4 mr-1" /> 生成
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onDownload(report)}>
                    <Download className="h-4 w-4 mr-1" /> 下载
                  </Button>
                  {!isCustomer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(report)}
                      disabled={!onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> 删除
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </React.Fragment>
        )))}
      </TableBody>
    </Table>
  );
}
