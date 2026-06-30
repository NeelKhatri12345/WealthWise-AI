import { type InputHTMLAttributes, type ReactNode } from "react";
export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Field label rendered above the input */
  label?: string;
  /** Validation error message — also sets aria-invalid */
  error?: string;
  /** Hint text shown below the input when there is no error */
  helperText?: string;
  /** Icon element rendered inside the input on the left */
  leftIcon?: ReactNode;
  /** Icon element rendered inside the input on the right (hidden when password toggle is active) */
  rightIcon?: ReactNode;
}
export declare const Input: import("react").ForwardRefExoticComponent<
  InputProps & import("react").RefAttributes<HTMLInputElement>
>;
