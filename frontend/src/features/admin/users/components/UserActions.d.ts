interface UserActionsProps {
  userId: string;
  currentStatus: "active" | "inactive" | "banned";
  onActivate: (id: string) => void;
  onBan: (id: string) => void;
  onDelete: (id: string) => void;
}
export declare const UserActions: ({
  userId,
  currentStatus,
  onActivate,
  onBan,
  onDelete,
}: UserActionsProps) => import("react").JSX.Element;
export {};
