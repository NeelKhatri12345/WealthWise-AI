import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useCallback, useEffect, useId, useRef, } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
// ---------------------------------------------------------------------------
// Size style map
// ---------------------------------------------------------------------------
const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};
// ---------------------------------------------------------------------------
// Focus-trap selector
// ---------------------------------------------------------------------------
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export const Modal = forwardRef(({ isOpen, onClose, title, children, className, size = "md", ...props }, ref) => {
    const titleId = useId();
    const panelRef = useRef(null);
    const previousFocusRef = useRef(null);
    // ----- Body scroll lock -----
    useEffect(() => {
        if (!isOpen)
            return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);
    // ----- Save & restore focus -----
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            // Defer so the panel is mounted before we try to focus inside it
            requestAnimationFrame(() => {
                const panel = panelRef.current;
                if (!panel)
                    return;
                const firstFocusable = panel.querySelector(FOCUSABLE);
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                else {
                    // Fall back to the panel itself
                    panel.focus();
                }
            });
        }
        else {
            // Restore focus when modal closes
            previousFocusRef.current?.focus();
            previousFocusRef.current = null;
        }
    }, [isOpen]);
    // ----- Escape key -----
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);
    // ----- Focus trap -----
    const handleKeyDown = useCallback((e) => {
        if (e.key !== "Tab")
            return;
        const panel = panelRef.current;
        if (!panel)
            return;
        const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
        if (focusable.length === 0)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            // Shift+Tab: wrap from first → last
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        }
        else {
            // Tab: wrap from last → first
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);
    // ----- Backdrop click (only when clicking the backdrop itself) -----
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);
    if (!isOpen)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", onClick: handleBackdropClick, onKeyDown: handleKeyDown, children: [_jsx("div", { className: "fixed inset-0 bg-black/50", "aria-hidden": "true" }), _jsxs("div", { ref: (node) => {
                    // Merge external ref + internal ref
                    panelRef.current = node;
                    if (typeof ref === "function")
                        ref(node);
                    else if (ref)
                        ref.current = node;
                }, role: "dialog", "aria-modal": "true", "aria-labelledby": title ? titleId : undefined, tabIndex: -1, className: cn("relative z-10 w-full rounded-2xl bg-white p-6 shadow-xl", "focus:outline-none", sizeStyles[size], className), ...props, children: [title && (_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { id: titleId, className: "text-lg font-semibold text-gray-900", children: title }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300", "aria-label": "Close dialog", children: "\u2715" })] })), children] })] }), document.body);
});
Modal.displayName = "Modal";
