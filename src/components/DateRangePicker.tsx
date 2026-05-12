import React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onClear?: () => void;
  className?: string;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange, 
  onClear,
  className = "" 
}: DateRangePickerProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {onClear && (startDate || endDate) && (
        <button 
          onClick={onClear}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Clear Dates"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
