import { type ReactNode } from "react";
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}
export declare function Modal({ isOpen, onClose, title, children, className, size }: ModalProps): import("react").JSX.Element | null;
export {};
