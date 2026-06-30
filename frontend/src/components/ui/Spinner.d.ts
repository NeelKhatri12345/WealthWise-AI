import { type HTMLAttributes } from "react";
declare const sizeStyles: {
    readonly sm: "h-4 w-4";
    readonly md: "h-8 w-8";
    readonly lg: "h-12 w-12";
};
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    /** Spinner diameter */
    size?: keyof typeof sizeStyles;
    /** Accessible label announced to screen readers (defaults to "Loading…") */
    label?: string;
}
export declare const Spinner: import("react").ForwardRefExoticComponent<SpinnerProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
