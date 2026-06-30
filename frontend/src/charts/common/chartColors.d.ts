export declare const CHART_COLORS: {
  readonly primary: "#6366f1";
  readonly primaryLight: "#818cf8";
  readonly primaryDark: "#4f46e5";
  readonly secondary: "#10b981";
  readonly secondaryLight: "#34d399";
  readonly secondaryDark: "#059669";
  readonly accent: "#f59e0b";
  readonly accentLight: "#fbbf24";
  readonly accentDark: "#d97706";
  readonly danger: "#ef4444";
  readonly dangerLight: "#f87171";
  readonly dangerDark: "#dc2626";
  readonly warning: "#f59e0b";
  readonly info: "#3b82f6";
  readonly success: "#10b981";
  readonly background: "#ffffff";
  readonly surface: "#f8fafc";
  readonly border: "#e2e8f0";
  readonly text: {
    readonly primary: "#1e293b";
    readonly secondary: "#64748b";
    readonly muted: "#94a3b8";
  };
  readonly categorical: readonly [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#06b6d4",
  ];
  readonly sequential: readonly [
    "#eef2ff",
    "#c7d2fe",
    "#a5b4fc",
    "#818cf8",
    "#6366f1",
    "#4f46e5",
    "#4338ca",
    "#3730a3",
  ];
  readonly diverging: {
    readonly negative: readonly ["#fecaca", "#f87171", "#ef4444", "#dc2626"];
    readonly neutral: "#f8fafc";
    readonly positive: readonly ["#a7f3d0", "#34d399", "#10b981", "#059669"];
  };
  readonly gauge: {
    readonly low: "#ef4444";
    readonly medium: "#f59e0b";
    readonly high: "#10b981";
    readonly bands: readonly [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#10b981",
    ];
  };
};
export type ChartColorKey = keyof typeof CHART_COLORS;
