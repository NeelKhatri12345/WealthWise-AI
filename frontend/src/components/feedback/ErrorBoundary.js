import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { Button } from "@/components/ui/Button";
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };
    render() {
        if (this.state.hasError) {
            if (this.props.fallback)
                return this.props.fallback;
            return (_jsxs("div", { className: "flex min-h-[400px] flex-col items-center justify-center p-8 text-center", children: [_jsx("h2", { className: "mb-2 text-xl font-semibold text-gray-900", children: "Something went wrong" }), _jsx("p", { className: "mb-4 text-sm text-wealth-muted", children: this.state.error?.message || "An unexpected error occurred." }), _jsx(Button, { onClick: this.handleReset, children: "Try Again" })] }));
        }
        return this.props.children;
    }
}
