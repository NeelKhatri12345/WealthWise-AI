import type { ReactNode } from "react";
interface NavLinkProps {
    to: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}
export declare function NavLink({ to, icon, children, className }: NavLinkProps): import("react").JSX.Element;
export {};
