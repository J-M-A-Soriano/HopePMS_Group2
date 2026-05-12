import React from 'react';
import { Calendar } from 'lucide-react';

export type DashboardPeriod = '24h' | '7d' | '30d' | 'month' | 'year' | 'custom';

interface PeriodSelectorProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
  className?: string;
}

export function PeriodSelector({ value, onChange, className = "" }: PeriodSelectorProps) {
  const options: { label: string; value: DashboardPeriod }[] = [
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom Range', value: 'custom' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DashboardPeriod)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium px-3 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
