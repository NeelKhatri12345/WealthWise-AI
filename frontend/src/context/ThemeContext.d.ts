export type Theme = "light" | "dark";
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
export declare const ThemeContext: import("react").Context<
  ThemeContextValue | undefined
>;
