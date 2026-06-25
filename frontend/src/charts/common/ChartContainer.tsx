import React, { useState } from 'react';

export type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showTimeRange?: boolean;
  timeRanges?: TimeRange[];
  defaultRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  actions?: React.ReactNode;
  className?: string;
}

const defaultTimeRanges: TimeRange[] = ['7d', '30d', '90d', '6m', '1y'];

const timeRangeLabels: Record<TimeRange, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '6m': '6M',
  '1y': '1Y',
  all: 'All',
};

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  showTimeRange = false,
  timeRanges = defaultTimeRanges,
  defaultRange = '30d',
  onTimeRangeChange,
  actions,
  className = '',
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>(defaultRange);

  const handleRangeChange = (range: TimeRange) => {
    setActiveRange(range);
    onTimeRangeChange?.(range);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showTimeRange && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => handleRangeChange(range)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeRange === range
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>

      <div className="px-2 pb-3">{children}</div>
    </div>
  );
};

export default ChartContainer;
