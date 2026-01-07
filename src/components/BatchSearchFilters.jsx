// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';

// 批量审核页搜索组件，复用通用 BaseSearchFilters
export function BatchSearchFilters({
  searchParams,
  setSearchParams,
  onSearch,
  onReset,
  loading,
}) {
  const fields = [
    {
      type: 'input',
      name: 'aufnr',
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
      name: 'vbeln',
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
      label: '检测类型',
      placeholder: '选择检测类型',
      options: [
        { value: 'all', label: '全部类型' },
        { value: '糖化', label: '糖化模式' },
        { value: '地贫', label: '地贫模式' },
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
