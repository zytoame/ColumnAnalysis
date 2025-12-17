// @ts-ignore
import React from 'react';
// @ts-ignore
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore
import { Filter, Search, Loader2 } from 'lucide-react';

/**
 * 通用搜索条件组件
 *
 * props:
 * - title: 标题文案
 * - fields: 字段配置数组
 *   - type: 'input' | 'select'
 *   - name: 对应 searchParams 中的字段名
 *   - label: label 文案
 *   - placeholder?: 占位文案
 *   - options?: { value: string; label: string }[]  // 仅 select 使用
 * - searchParams: 当前查询参数对象
 * - setSearchParams: (next) => void，用于更新查询参数
 * - onSearch: () => void
 * - onReset: () => void
 * - loading: boolean
 */
export function BaseSearchFilters({
  title = '查询条件',
  fields,
  searchParams,
  setSearchParams,
  onSearch,
  onReset,
  loading,
}) {
  const handleInputChange = (name, value) => {
    setSearchParams({
      ...searchParams,
      [name]: value,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {fields.map((field) => {
            if (field.type === 'input') {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <Input
                    placeholder={field.placeholder}
                    value={searchParams[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <Select
                    value={searchParams[field.name]}
                    onValueChange={(value) => handleInputChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            return null;
          })}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            查询
          </Button>
          <Button variant="outline" onClick={onReset}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
