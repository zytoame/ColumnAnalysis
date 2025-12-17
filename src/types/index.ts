/**
 * 类型定义
 */

import { LucideIcon } from 'lucide-react';

// 检测数据项
export interface DetectionDataItem {
  standard: string;
  result: string;
  conclusion: 'pass' | 'fail';
  icon: LucideIcon | string;
  rawValues?: Record<string, string[]>;
}

// 检测数据
export interface DetectionData {
  setTemperature?: DetectionDataItem;
  pressure?: DetectionDataItem;
  peakTime?: DetectionDataItem;
  repeatabilityTest?: DetectionDataItem;
  appearanceInspection?: DetectionDataItem;
  moduleTemperature?: DetectionDataItem;
  systemPressure?: DetectionDataItem;
  hbA1cAppearanceTime?: DetectionDataItem;
}

// 操作历史
export interface OperationHistory {
  time: string;
  operator: string;
  action: string;
  remark: string;
}

// 层析柱/报告基础信息
export interface BaseReport {
  id: string;
  workOrder: string;
  columnSn: string;
  orderNumber: string;
  instrumentSerial: string;
  columnName?: string;
  testType: string;
  testDate: string;
  testResult?: string;
  operator: string;
  submitTime: string;
  detectionData?: DetectionData;
  finalConclusion?: 'qualified' | 'unqualified';
  operationHistory?: OperationHistory[];
}

// 待审核层析柱
export interface PendingColumn extends BaseReport {
  columnName: string;
  finalConclusion: 'qualified' | 'unqualified';
}

// 报告
export interface Report extends BaseReport {
  columnName: string;
  finalConclusion: 'qualified' | 'unqualified';
}

// 不合格层析柱
export interface UnqualifiedColumn extends BaseReport {
  reportType: 'glycation' | 'thalassemia';
  status: 'unqualified';
  reportDate: string;
  检测项目: string;
  检测结果: string;
  负责人: string;
  审核状态: string;
  不合格原因: string;
  generateTime: string;
}

// 搜索参数
export interface SearchParams {
  workOrder?: string;
  columnSn?: string;
  orderNumber?: string;
  instrumentSerial?: string;
  testType?: string;
  testResult?: string;
  reportType?: string;
  dateRange?: string;
}

// 工单统计
export interface WorkOrderStats {
  workOrderNumber: string;
  workOrderName: string;
  totalQuantity: number;
  completedQuantity: number;
  remainingQuantity: number;
  dailyCompleted: number;
  startDate: string;
  expectedEndDate: string;
  progress: number;
}

// 页面 Props
export interface PageProps {
  $w?: any;
  style?: React.CSSProperties;
}

// SignaturePad Props
export interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => Promise<void>;
  signing?: boolean;
}
