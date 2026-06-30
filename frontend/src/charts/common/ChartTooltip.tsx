import React from "react";

export interface TooltipRow {
  label: string;
  value: string | number;
  color?: string;
}

export interface ChartTooltipProps {
  title?: string;
  rows: TooltipRow[];
  footer?: string;
  className?: string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  title,
  rows,
  footer,
  className = "",
}) => {
  return (
    <div
      className={`bg-slate-800 text-white rounded-lg shadow-xl px-3 py-2.5 text-sm ${className}`}
    >
      {title && (
        <div className="text-slate-300 text-xs font-medium mb-1.5 border-b border-slate-600 pb-1.5">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {row.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              <span className="text-slate-300">{row.label}</span>
            </div>
            <span className="font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="text-slate-400 text-xs mt-1.5 pt-1.5 border-t border-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartTooltip;
