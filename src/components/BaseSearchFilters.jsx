// @ts-ignore
import React from 'react';
// @ts-ignore
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore
import { Filter, Search, Loader2 } from 'lucide-react';
// @ts-ignore
import { Calendar as CalendarIcon } from 'lucide-react';
// @ts-ignore
import { format, parseISO, isValid } from 'date-fns';
// @ts-ignore
import { cn } from '@/lib/utils';
// @ts-ignore
import { Calendar } from '@/components/ui/calendar';
// @ts-ignore
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
 *   - startName?: dateRange 类型的开始日期字段名
 *   - endName?: dateRange 类型的结束日期字段名
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

            if (field.type === 'dateRange') {
              const key = `${field.startName}-${field.endName}`;
              const startDate = searchParams[field.startName]
                ? parseISO(searchParams[field.startName])
                : undefined;
              const endDate = searchParams[field.endName]
                ? parseISO(searchParams[field.endName])
                : undefined;

              const selectedRange = {
                from: startDate && isValid(startDate) ? startDate : undefined,
                to: endDate && isValid(endDate) ? endDate : undefined,
              };

              const displayText = selectedRange?.from
                ? selectedRange?.to
                  ? `${format(selectedRange.from, 'yyyy/MM/dd')} - ${format(selectedRange.to, 'yyyy/MM/dd')}`
                  : format(selectedRange.from, 'yyyy/MM/dd')
                : '';

              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!displayText}
                        className={cn(
                          'data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {displayText ? <span>{displayText}</span> : <span>yyyy/MM/dd - yyyy/MM/dd</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={selectedRange}
                        onSelect={(range) => {
                          const from = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
                          const to = range?.to ? format(range.to, 'yyyy-MM-dd') : '';
                          setSearchParams({
                            ...searchParams,
                            [field.startName]: from,
                            [field.endName]: to,
                          });
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }

            if (field.type === 'date') {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <Input
                    type="date"
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
