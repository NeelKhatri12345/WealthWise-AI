export { colors } from "./colors";
export { typography } from "./typography";
export { spacing, layout } from "./spacing";
export declare const theme: {
    readonly colors: () => Promise<{
        readonly primary: {
            readonly 50: "#eff6ff";
            readonly 100: "#dbeafe";
            readonly 200: "#bfdbfe";
            readonly 300: "#93c5fd";
            readonly 400: "#60a5fa";
            readonly 500: "#2563eb";
            readonly 600: "#1d4ed8";
            readonly 700: "#1e40af";
            readonly 800: "#1e3a8a";
            readonly 900: "#172554";
        };
        readonly secondary: {
            readonly 50: "#f0fdf4";
            readonly 100: "#dcfce7";
            readonly 200: "#bbf7d0";
            readonly 300: "#86efac";
            readonly 400: "#4ade80";
            readonly 500: "#16a34a";
            readonly 600: "#15803d";
            readonly 700: "#166534";
            readonly 800: "#14532d";
            readonly 900: "#052e16";
        };
        readonly semantic: {
            readonly success: "#10b981";
            readonly warning: "#f59e0b";
            readonly danger: "#ef4444";
            readonly info: "#3b82f6";
        };
        readonly neutral: {
            readonly bg: "#f8fafc";
            readonly card: "#ffffff";
            readonly border: "#e2e8f0";
            readonly text: "#1e293b";
            readonly muted: "#64748b";
        };
    }>;
    readonly typography: () => Promise<{
        readonly fontFamily: {
            readonly sans: readonly ["Inter", "system-ui", "-apple-system", "sans-serif"];
            readonly mono: readonly ["JetBrains Mono", "Fira Code", "monospace"];
        };
        readonly fontSize: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly base: "1rem";
            readonly lg: "1.125rem";
            readonly xl: "1.25rem";
            readonly "2xl": "1.5rem";
            readonly "3xl": "1.875rem";
            readonly "4xl": "2.25rem";
        };
        readonly fontWeight: {
            readonly normal: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
        };
        readonly lineHeight: {
            readonly tight: 1.25;
            readonly normal: 1.5;
            readonly relaxed: 1.75;
        };
    }>;
    readonly spacing: () => Promise<{
        readonly 0: "0";
        readonly 1: "0.25rem";
        readonly 2: "0.5rem";
        readonly 3: "0.75rem";
        readonly 4: "1rem";
        readonly 5: "1.25rem";
        readonly 6: "1.5rem";
        readonly 8: "2rem";
        readonly 10: "2.5rem";
        readonly 12: "3rem";
        readonly 16: "4rem";
        readonly 20: "5rem";
        readonly 24: "6rem";
    }>;
};
