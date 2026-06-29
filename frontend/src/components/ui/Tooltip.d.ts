import { type ReactNode } from "react";
interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
}
export declare function Tooltip({ content, children, position, className }: TooltipProps): import("react").JSX.Element;
export {};
