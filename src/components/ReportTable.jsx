// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Checkbox } from '@/components/ui';
// @ts-ignore;
import { Eye, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
// @ts-ignore;
import { DetectionDataCard } from '@/components/DetectionDataCard.jsx';
import { ModeTag } from '@/components/AntdTag.jsx';

export const ReportTable = ({
  reports = [],
  selectedReports = [],
  onSelectReport,
  onSelectAll,
  onPreview,
  onDownload,
}) => {
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
          <TableHead>层析柱序列号</TableHead>
          <TableHead>工单号</TableHead>
          <TableHead>订单号</TableHead>
          <TableHead>仪器序列号</TableHead>
          <TableHead>检测模式</TableHead>
          <TableHead>检测日期</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
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
              <TableCell className="font-medium">{report.columnSn}</TableCell>
              <TableCell>{report.sapWorkOrderNo}</TableCell>
              <TableCell>{report.sapOrderNo}</TableCell>
              <TableCell>{report.deviceSn}</TableCell>
              <TableCell>
                <ModeTag mode={report.mode} />
              </TableCell>
              <TableCell>{report.inspectionDate}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {/* 必须传入 report 对象 */}
                  {/* 展开/收起按钮 
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpand(report.columnSn)}
                    title={expandedRows.includes(report.columnSn) ? "收起详情" : "展开详情"}
                  >
                    {expandedRows.includes(report.columnSn) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>*/}
                  <Button variant="ghost" size="sm" onClick={() => onPreview(report)}>
                    <Eye className="h-4 w-4 mr-1" /> 预览
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGenerate?.(report)}
                    disabled={!onGenerate}
                  >
                    <FileText className="h-4 w-4 mr-1" /> 生成
                  </Button> */}
                  <Button variant="ghost" size="sm" onClick={() => onDownload(report)}>
                    <Download className="h-4 w-4 mr-1" /> 下载
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            {/* 展开的检测数据行 
            {expandedRows.includes(report.columnSn) && (
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
            )}*/}
          </React.Fragment>
        )))}
      </TableBody>
    </Table>
  );
}
