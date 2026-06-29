interface AuditEntry {
    id: string;
    action: string;
    user: string;
    resource: string;
    timestamp: string;
    ipAddress?: string;
    status: 'success' | 'failure';
}
interface AuditTableProps {
    entries: AuditEntry[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEntryClick?: (id: string) => void;
}
export declare const AuditTable: ({ entries, currentPage, totalPages, onPageChange, onEntryClick }: AuditTableProps) => import("react").JSX.Element;
export {};
