import { type HTMLAttributes } from "react";
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Internal padding preset — use `"none"` when composing with Card subcomponents */
  padding?: "none" | "sm" | "md" | "lg";
}
export declare const Card: import("react").ForwardRefExoticComponent<
  CardProps & import("react").RefAttributes<HTMLDivElement>
>;
export declare const CardHeader: import("react").ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>
>;
export declare const CardTitle: import("react").ForwardRefExoticComponent<
  HTMLAttributes<HTMLHeadingElement> &
    import("react").RefAttributes<HTMLHeadingElement>
>;
export declare const CardDescription: import("react").ForwardRefExoticComponent<
  HTMLAttributes<HTMLParagraphElement> &
    import("react").RefAttributes<HTMLParagraphElement>
>;
export declare const CardContent: import("react").ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>
>;
export declare const CardFooter: import("react").ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & import("react").RefAttributes<HTMLDivElement>
>;
export {};
