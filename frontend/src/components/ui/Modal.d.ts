import { type HTMLAttributes } from "react";
declare const sizeStyles: {
    readonly sm: "max-w-sm";
    readonly md: "max-w-md";
    readonly lg: "max-w-lg";
    readonly xl: "max-w-xl";
};
export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    /** Whether the modal is visible */
    isOpen: boolean;
    /** Called when the user requests to close (backdrop click, Escape, close button) */
    onClose: () => void;
    /** Optional dialog title rendered in the header */
    title?: string;
    /** Size preset controlling `max-width` */
    size?: keyof typeof sizeStyles;
}
export declare const Modal: import("react").ForwardRefExoticComponent<ModalProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
