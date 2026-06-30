import { Component, type ErrorInfo, type ReactNode } from "react";
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    handleReset: () => void;
    render(): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<unknown>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
}
export {};
