import { type ButtonHTMLAttributes, type ReactNode } from "react";
declare const variantStyles: {
    readonly primary: "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-300 active:bg-primary-700";
    readonly secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-300 active:bg-secondary-700";
    readonly outline: "border border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-300 active:bg-primary-100";
    readonly danger: "bg-wealth-danger text-white hover:bg-red-600 focus-visible:ring-red-300 active:bg-red-700";
    readonly ghost: "text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300 active:bg-gray-200";
};
declare const sizeStyles: {
    readonly sm: "px-3 py-1.5 text-sm gap-1.5";
    readonly md: "px-4 py-2 text-sm gap-2";
    readonly lg: "px-6 py-3 text-base gap-2.5";
};
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: keyof typeof variantStyles;
    /** Button size */
    size?: keyof typeof sizeStyles;
    /** Shows a spinner and disables the button */
    isLoading?: boolean;
    /** Icon element rendered before children */
    leftIcon?: ReactNode;
    /** Icon element rendered after children */
    rightIcon?: ReactNode;
}
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export {};
