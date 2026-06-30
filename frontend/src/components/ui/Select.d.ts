import { type SelectHTMLAttributes } from "react";
import type { SelectOption } from "@/types/common.types";
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}
export declare const Select: import("react").ForwardRefExoticComponent<
  SelectProps & import("react").RefAttributes<HTMLSelectElement>
>;
export {};
