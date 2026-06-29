import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "primary", isLoading, }) {
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, title: title, size: "sm", children: [_jsx("p", { className: "mb-6 text-sm text-wealth-muted", children: message }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: isLoading, children: cancelLabel }), _jsx(Button, { variant: variant === "danger" ? "danger" : "primary", onClick: onConfirm, isLoading: isLoading, children: confirmLabel })] })] }));
}
