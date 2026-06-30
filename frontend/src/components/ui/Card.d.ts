import { type HTMLAttributes } from "react";
declare const paddingStyles: {
    readonly none: "";
    readonly sm: "p-4";
    readonly md: "p-6";
    readonly lg: "p-8";
};
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Internal padding preset — use `"none"` when composing with Card subcomponents */
    padding?: keyof typeof paddingStyles;
}
export declare const Card: import("react").ForwardRefExoticComponent<CardProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardHeader: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardTitle: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement> & import("react").RefAttributes<HTMLHeadingElement>>;
export declare const CardDescription: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement> & import("react").RefAttributes<HTMLParagraphElement>>;
export declare const CardContent: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardFooter: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>>;
export {};
