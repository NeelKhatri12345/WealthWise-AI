import { type HTMLAttributes } from "react";
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: "info" | "success" | "warning" | "error";
  /** Optional bold heading rendered above the body */
  title?: string;
  /** Called when the dismiss button is clicked */
  onClose?: () => void;
}
export declare const Alert: import("react").ForwardRefExoticComponent<
  AlertProps & import("react").RefAttributes<HTMLDivElement>
>;
export {};
