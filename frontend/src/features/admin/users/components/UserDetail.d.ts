interface UserDetailProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive" | "banned";
    createdAt: string;
    lastLogin?: string;
    transactionCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: "active" | "inactive" | "banned") => void;
}
export declare const UserDetail: ({
  user,
  isOpen,
  onClose,
  onStatusChange,
}: UserDetailProps) => import("react").JSX.Element | null;
export {};
