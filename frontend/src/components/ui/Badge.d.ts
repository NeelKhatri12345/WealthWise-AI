import { type HTMLAttributes, type ReactNode } from "react";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Visual style variant */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    /** Badge size */
    size?: 'sm' | 'md';
    /** Icon element rendered before children */
    leftIcon?: ReactNode;
    /** Icon element rendered after children */
    rightIcon?: ReactNode;
}
export declare const Badge: import("react").ForwardRefExoticComponent<BadgeProps & import("react").RefAttributes<HTMLSpanElement>>;
export {};
