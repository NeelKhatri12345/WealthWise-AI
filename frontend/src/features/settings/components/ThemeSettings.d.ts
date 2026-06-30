type Theme = "light" | "dark" | "system";
interface ThemeSettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}
export declare const ThemeSettings: ({
  currentTheme,
  onThemeChange,
}: ThemeSettingsProps) => import("react").JSX.Element;
export {};
