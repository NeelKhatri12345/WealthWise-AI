import type { ReactNode } from "react";
declare const variants: {
    info: string;
    success: string;
    warning: string;
    error: string;
};
interface AlertProps {
    children: ReactNode;
    variant?: keyof typeof variants;
    title?: string;
    onClose?: () => void;
    className?: string;
}
export declare function Alert({ children, variant, title, onClose, className }: AlertProps): import("react").JSX.Element;
export {};
