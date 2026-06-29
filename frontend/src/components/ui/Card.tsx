import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Card (root)
// ---------------------------------------------------------------------------

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Internal padding preset — use `"none"` when composing with Card subcomponents */
  padding?: keyof typeof paddingStyles;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-wealth-border bg-wealth-card shadow-sm",
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 px-6 py-4", className)}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-wealth-muted", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
));

CardContent.displayName = "CardContent";

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-t border-wealth-border bg-gray-50 px-6 py-3",
      className,
    )}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";
