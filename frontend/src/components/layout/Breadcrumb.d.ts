interface BreadcrumbItem {
    label: string;
    href?: string;
}
interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}
export declare function Breadcrumb({ items, className }: BreadcrumbProps): import("react").JSX.Element;
export {};
