import { type HTMLAttributes, type ReactNode } from "react";
declare const variantStyles: {
    readonly default: "bg-gray-100 text-gray-700";
    readonly primary: "bg-primary-100 text-primary-700";
    readonly success: "bg-green-100 text-green-700";
    readonly warning: "bg-amber-100 text-amber-700";
    readonly danger: "bg-red-100 text-red-700";
    readonly info: "bg-blue-100 text-blue-700";
    readonly neutral: "bg-gray-50 text-gray-500";
};
declare const sizeStyles: {
    readonly sm: "px-2 py-0.5 text-xs gap-1";
    readonly md: "px-2.5 py-0.5 text-xs gap-1.5";
};
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Visual style variant */
    variant?: keyof typeof variantStyles;
    /** Badge size */
    size?: keyof typeof sizeStyles;
    /** Icon element rendered before children */
    leftIcon?: ReactNode;
    /** Icon element rendered after children */
    rightIcon?: ReactNode;
}
export declare const Badge: import("react").ForwardRefExoticComponent<BadgeProps & import("react").RefAttributes<HTMLSpanElement>>;
export {};
