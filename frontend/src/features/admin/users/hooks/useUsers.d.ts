interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "banned";
  createdAt: string;
  lastLogin?: string;
  transactionCount?: number;
}
interface UseUsersReturn {
  users: User[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  updateUserStatus: (
    id: string,
    status: "active" | "inactive" | "banned",
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refetch: () => void;
}
export declare const useUsers: (
  page?: number,
  filters?: {
    role?: string;
    status?: string;
    search?: string;
  },
) => UseUsersReturn;
export {};
