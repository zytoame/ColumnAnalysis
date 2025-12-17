/**
 * 过滤工具函数
 */

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

/**
 * 过滤数据
 */
export function filterData<T extends Record<string, any>>(
  data: T[],
  searchParams: SearchParams
): T[] {
  return data.filter((item) => {
    // 工单号过滤
    if (
      searchParams.workOrder &&
      !item.workOrder?.toLowerCase().includes(searchParams.workOrder.toLowerCase())
    ) {
      return false;
    }

    // 层析柱序列号过滤
    if (
      searchParams.columnSn &&
      !item.columnSn?.toLowerCase().includes(searchParams.columnSn.toLowerCase())
    ) {
      return false;
    }

    // 订单号过滤
    if (
      searchParams.orderNumber &&
      !item.orderNumber?.toLowerCase().includes(searchParams.orderNumber.toLowerCase())
    ) {
      return false;
    }

    // 仪器序列号过滤
    if (
      searchParams.instrumentSerial &&
      !item.instrumentSerial?.toLowerCase().includes(searchParams.instrumentSerial.toLowerCase())
    ) {
      return false;
    }

    // 检测类型过滤
    if (searchParams.testType && searchParams.testType !== 'all') {
      if (item.testType !== searchParams.testType) {
        return false;
      }
    }

    // 检测结果过滤
    if (searchParams.testResult && searchParams.testResult !== 'all') {
      if (item.testResult !== searchParams.testResult) {
        return false;
      }
    }

    // 报告类型过滤
    if (searchParams.reportType && searchParams.reportType !== 'all') {
      if (item.reportType !== searchParams.reportType) {
        return false;
      }
    }

    // 时间范围过滤
    if (searchParams.dateRange && searchParams.dateRange !== 'all') {
      const itemDate = new Date(item.submitTime || item.reportDate || item.testDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (searchParams.dateRange) {
        case 'today':
          if (itemDate < today) return false;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (itemDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (itemDate < monthAgo) return false;
          break;
      }
    }

    return true;
  });
}
