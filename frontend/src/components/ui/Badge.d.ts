import type { ReactNode } from "react";
declare const variants: {
    default: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
};
interface BadgeProps {
    children: ReactNode;
    variant?: keyof typeof variants;
    className?: string;
}
export declare function Badge({ children, variant, className }: BadgeProps): import("react").JSX.Element;
export {};
