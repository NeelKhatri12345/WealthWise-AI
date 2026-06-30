interface AuditDetailProps {
  entry: {
    id: string;
    action: string;
    user: string;
    resource: string;
    timestamp: string;
    ipAddress?: string;
    status: "success" | "failure";
    details?: Record<string, unknown>;
    userAgent?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}
export declare const AuditDetail: ({
  entry,
  isOpen,
  onClose,
}: AuditDetailProps) => import("react").JSX.Element | null;
export {};
