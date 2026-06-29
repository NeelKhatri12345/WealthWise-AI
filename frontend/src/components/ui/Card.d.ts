import type { ReactNode, HTMLAttributes } from "react";
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padding?: "none" | "sm" | "md" | "lg";
}
export declare function Card({ children, className, padding, ...props }: CardProps): import("react").JSX.Element;
export {};
