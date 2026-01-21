// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { BaseSearchFilters } from '@/components/BaseSearchFilters.jsx';

// 不合格层析柱管理页搜索组件，复用通用 BaseSearchFilters
export function UnqualifiedSearchFilters({
  searchParams,
  setSearchParams,
  onSearch,
  onReset,
  loading,
}) {
  const fields = [
    {
      type: 'input',
      name: 'productSn',
      label: '成品序列号',
      placeholder: '请输入成品序列号',
    },
    {
      type: 'input',
      name: 'columnSn',
      label: '层析柱序列号',
      placeholder: '请输入层析柱序列号',
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
