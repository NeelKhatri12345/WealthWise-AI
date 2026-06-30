import { type HTMLAttributes } from "react";
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    /** Spinner diameter */
    size?: 'sm' | 'md' | 'lg';
    /** Accessible label announced to screen readers (defaults to "Loading…") */
    label?: string;
}
export declare const Spinner: import("react").ForwardRefExoticComponent<SpinnerProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
