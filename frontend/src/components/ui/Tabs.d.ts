import { type ReactNode } from "react";
interface Tab {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
}
interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    className?: string;
}
export declare function Tabs({ tabs, defaultTab, onChange, className }: TabsProps): import("react").JSX.Element;
export {};
