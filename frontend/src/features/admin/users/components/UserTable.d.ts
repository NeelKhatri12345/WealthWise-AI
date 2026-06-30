interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "banned";
  createdAt: string;
}
interface UserTableProps {
  users: User[];
  onUserClick?: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
export declare const UserTable: ({
  users,
  onUserClick,
  currentPage,
  totalPages,
  onPageChange,
}: UserTableProps) => import("react").JSX.Element;
export {};
