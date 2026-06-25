export { colors } from "./colors";
export { typography } from "./typography";
export { spacing, layout } from "./spacing";

export const theme = {
  colors: () => import("./colors").then((m) => m.colors),
  typography: () => import("./typography").then((m) => m.typography),
  spacing: () => import("./spacing").then((m) => m.spacing),
} as const;
