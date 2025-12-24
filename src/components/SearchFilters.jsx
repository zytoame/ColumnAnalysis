// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';

// 报告查询页专用搜索组件，复用通用 BaseSearchFilters
export function SearchFilters({
  searchParams,
  setSearchParams,
  onSearch,
  onReset,
  loading,
}) {
  const fields = [
    {
      type: 'input',
      name: 'sapWorkOrderNo',
      label: '工单号',
      placeholder: '请输入工单号',
    },
    {
      type: 'input',
      name: 'columnSn',
      label: '层析柱序列号',
      placeholder: '请输入层析柱序列号',
    },
    {
      type: 'input',
      name: 'sapOrderNo',
      label: '订单号',
      placeholder: '请输入订单号',
    },
    {
      type: 'input',
      name: 'deviceSn',
      label: '仪器序列号',
      placeholder: '请输入仪器序列号',
    },
    {
      type: 'select',
      name: 'mode',
      label: '检测模式',
      placeholder: '选择检测模式',
      options: [
        { value: 'all', label: '全部模式' },
        { value: '糖化', label: '糖化' },
        { value: '地贫', label: '地贫' },
      ],
    },
    {
      type: 'select',
      name: 'status',
      label: '报告状态',
      placeholder: '选择报告状态',
      options: [
        { value: 'all', label: '全部状态' },
        { value: 'GENERATED', label: '已生成' },
        { value: 'DOWNLOADED', label: '已下载' },
      ],
    },
  ];

  return (
    <BaseSearchFilters
      title="查询条件"
      fields={fields}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      onSearch={onSearch}
      onReset={onReset}
      loading={loading}
    />
  );
}
