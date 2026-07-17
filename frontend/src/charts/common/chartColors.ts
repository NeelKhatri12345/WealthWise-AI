export const CHART_COLORS = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryDark: "#4f46e5",

  secondary: "#10b981",
  secondaryLight: "#34d399",
  secondaryDark: "#059669",

  accent: "#f59e0b",
  accentLight: "#fbbf24",
  accentDark: "#d97706",

  danger: "#ef4444",
  dangerLight: "#f87171",
  dangerDark: "#dc2626",

  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#10b981",

  background: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",

  text: {
    primary: "#1e293b",
    secondary: "#64748b",
    muted: "#94a3b8",
  },

  categorical: [
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
  ],

  sequential: [
    "#eef2ff",
    "#c7d2fe",
    "#a5b4fc",
    "#818cf8",
    "#6366f1",
    "#4f46e5",
    "#4338ca",
    "#3730a3",
  ],

  diverging: {
    negative: ["#fecaca", "#f87171", "#ef4444", "#dc2626"],
    neutral: "#f8fafc",
    positive: ["#a7f3d0", "#34d399", "#10b981", "#059669"],
  },

  gauge: {
    low: "#ef4444",
    medium: "#f59e0b",
    high: "#10b981",
    bands: ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981"],
  },
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;
