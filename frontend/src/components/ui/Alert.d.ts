import { type HTMLAttributes } from "react";
declare const variantStyles: {
    readonly info: "bg-blue-50 border-blue-200 text-blue-800";
    readonly success: "bg-green-50 border-green-200 text-green-800";
    readonly warning: "bg-amber-50 border-amber-200 text-amber-800";
    readonly error: "bg-red-50 border-red-200 text-red-800";
};
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual style variant */
    variant?: keyof typeof variantStyles;
    /** Optional bold heading rendered above the body */
    title?: string;
    /** Called when the dismiss button is clicked */
    onClose?: () => void;
}
export declare const Alert: import("react").ForwardRefExoticComponent<AlertProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
