import { type ButtonHTMLAttributes } from "react";
declare const variants: {
    primary: string;
    secondary: string;
    outline: string;
    ghost: string;
    danger: string;
};
declare const sizes: {
    sm: string;
    md: string;
    lg: string;
};
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
    isLoading?: boolean;
}
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export {};
