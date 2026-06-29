import { type ReactNode } from "react";
interface DropdownItem {
    label: string;
    value: string;
    icon?: ReactNode;
    disabled?: boolean;
}
interface DropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    onSelect: (value: string) => void;
    className?: string;
    align?: "left" | "right";
}
export declare function Dropdown({ trigger, items, onSelect, className, align }: DropdownProps): import("react").JSX.Element;
export {};
