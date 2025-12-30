import React from 'react';
// @ts-ignore
import { Badge } from '@/components/ui';
// @ts-ignore
import { cn } from '@/lib/utils';

const COLOR_STYLES = {
  amber: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    dot: 'bg-amber-500',
  },
  cyan: {
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
    dot: 'bg-cyan-500',
  },
  green: {
    badge: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    dot: 'bg-green-500',
  },
  red: {
    badge: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    dot: 'bg-red-500',
  },
  sky: {
    badge: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    dot: 'bg-sky-500',
  },
  violet: {
    badge: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
    dot: 'bg-violet-500',
  },
  slate: {
    badge: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    dot: 'bg-slate-400',
  },
};

export function AntdTag({
  label,
  color = 'slate',
  showDot = true,
  prefix,
  className,
}) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.slate;

  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap gap-1 rounded-sm px-2 py-0.5 text-xs font-normal',
        styles.badge,
        className,
      )}
    >
      {prefix ? prefix : null}
      {showDot ? (
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full', styles.dot)} />
      ) : null}
      <span>{label ?? '-'}</span>
    </Badge>
  );
}

export function ModeTag({ mode }) {
  const m = (mode || '').trim();
  if (m.includes('糖化')) return <AntdTag label={mode || '-'} color="amber" />;
  if (m.includes('地贫')) return <AntdTag label={mode || '-'} color="cyan" />;
  return <AntdTag label={mode || '-'} color="slate" />;
}

export function StatusTag({ status }) {
  const s = (status || '').trim();
  if (s === '合格') return <AntdTag label={status || '-'} color="green" />;
  if (s === '不合格') return <AntdTag label={status || '-'} color="red" />;
  if (s === '已审核') return <AntdTag label={status || '-'} color="sky" />;
  if (s === '已生成报告') return <AntdTag label={status || '-'} color="violet" />;
  return <AntdTag label={status || '-'} color="slate" />;
}

export function ConclusionTag({ value }) {
  const v = (value || '').trim();
  if (v === 'pass') return <AntdTag label="合格" color="green" />;
  if (v === 'fail') return <AntdTag label="不合格" color="red" />;
  if (v === 'qualified') return <AntdTag label="合格" color="green" />;
  if (v === 'unqualified') return <AntdTag label="不合格" color="red" />;
  if (v === '最终合格') return <AntdTag label="最终合格" color="green" />;
  if (v === '最终不合格') return <AntdTag label="最终不合格" color="red" />;
  return <AntdTag label={value || '-'} color="slate" />;
}

export function FinalConclusionTag({ value }) {
  const v = (value || '').trim();
  if (v === 'qualified') return <AntdTag label="最终合格" color="green" />;
  if (v === 'unqualified') return <AntdTag label="最终不合格" color="red" />;
  return <AntdTag label={value || '-'} color="slate" />;
}
