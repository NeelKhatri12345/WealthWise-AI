interface NotificationItemProps {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    createdAt: string;
    onMarkRead?: () => void;
    onDelete?: () => void;
}
export declare const NotificationItem: ({ title, message, type, read, createdAt, onMarkRead, onDelete, }: NotificationItemProps) => import("react").JSX.Element;
export {};
