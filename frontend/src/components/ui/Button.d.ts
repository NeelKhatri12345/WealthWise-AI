import { type ButtonHTMLAttributes, type ReactNode } from "react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and disables the button */
  isLoading?: boolean;
  /** Icon element rendered before children */
  leftIcon?: ReactNode;
  /** Icon element rendered after children */
  rightIcon?: ReactNode;
}
export declare const Button: import("react").ForwardRefExoticComponent<
  ButtonProps & import("react").RefAttributes<HTMLButtonElement>
>;
export {};
