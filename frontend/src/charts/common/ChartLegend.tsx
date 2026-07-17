import React from "react";

export interface LegendItem {
  name: string;
  color: string;
  value?: string | number;
  active?: boolean;
}

export interface ChartLegendProps {
  items: LegendItem[];
  onToggle?: (index: number) => void;
  layout?: "horizontal" | "vertical";
  className?: string;
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  items,
  onToggle,
  layout = "horizontal",
  className = "",
}) => {
  const containerClass =
    layout === "horizontal"
      ? "flex flex-wrap items-center gap-4"
      : "flex flex-col gap-2";

  return (
    <div className={`${containerClass} ${className}`}>
      {items.map((item, index) => (
        <button
          key={item.name}
          onClick={() => onToggle?.(index)}
          className={`flex items-center gap-2 text-sm transition-opacity ${
            item.active === false ? "opacity-40" : "opacity-100"
          } ${onToggle ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-600 font-medium">{item.name}</span>
          {item.value !== undefined && (
            <span className="text-slate-800 font-semibold">{item.value}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChartLegend;
