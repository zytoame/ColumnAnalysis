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
      name: 'GI_AUFNR',
      label: '工单号(AUFNR)',
      placeholder: '请输入工单号',
    },
    {
      type: 'input',
      name: 'productSn',
      label: '成品序列号',
      placeholder: '请输入成品序列号',
    },
    {
      type: 'input',
      name: 'GI_VBELN',
      label: '订单号(VBELN)',
      placeholder: '请输入订单号',
    },
    {
      type: 'input',
      name: 'GI_RSNUM',
      label: '预留单号(RSNUM)',
      placeholder: '请输入预留单号',
    },
    {
      type: 'input',
      name: 'GI_ZDH',
      label: '非生产领料单号(ZDH)',
      placeholder: '请输入非生产领料单号',
    },
    {
      type: 'input',
      name: 'GI_ZBHLS',
      label: '备货单号(ZBHS)',
      placeholder: '请输入备货单号',
    },
    {
      type: 'select',
      name: 'reportType',
      label: '报告类型',
      placeholder: '选择报告类型',
      options:[
        {value: 'all', label: '全部'},
        {value: 'CN', label: 'CN'},
        {value: 'EN', label: 'EN'},
      ]
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
