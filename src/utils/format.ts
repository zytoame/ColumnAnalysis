/**
 * 格式化工具函数
 */

import { DETECTION_ITEM_NAMES, REPORT_TYPE_LABELS, USER_TYPE_LABELS } from '@/constants';

/**
 * 获取检测项目显示名称
 */
export function getDetectionItemName(key: string): string {
  return DETECTION_ITEM_NAMES[key as keyof typeof DETECTION_ITEM_NAMES] || key;
}

/**
 * 获取报告类型显示名称
 */
export function getReportTypeLabel(type: string): string {
  return REPORT_TYPE_LABELS[type as keyof typeof REPORT_TYPE_LABELS] || type;
}

/**
 * 获取用户类型显示名称
 */
export function getUserTypeLabel(type: string): string {
  return USER_TYPE_LABELS[type as keyof typeof USER_TYPE_LABELS] || type;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date as string;
  
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date as string;
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
