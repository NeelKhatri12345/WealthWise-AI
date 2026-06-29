import type { ReactNode } from "react";
interface NavGroupProps {
    label: string;
    children: ReactNode;
    className?: string;
}
export declare function NavGroup({ label, children, className }: NavGroupProps): import("react").JSX.Element;
export {};
