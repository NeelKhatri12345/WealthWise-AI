import { type HTMLAttributes, type ReactNode } from "react";
export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}
export interface DropdownProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** The element that opens the menu when activated */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownItem[];
  /** Called when an enabled item is selected */
  onSelect: (value: string) => void;
  /** Horizontal alignment of the menu relative to the trigger */
  align?: "left" | "right";
}
export declare const Dropdown: import("react").ForwardRefExoticComponent<
  DropdownProps & import("react").RefAttributes<HTMLDivElement>
>;
