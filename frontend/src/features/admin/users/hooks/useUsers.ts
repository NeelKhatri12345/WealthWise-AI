import { useState, useEffect, useCallback } from "react";

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

export const useUsers = (
  page = 1,
  filters?: { role?: string; status?: string; search?: string },
): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      void page;
      void filters?.role;
      void filters?.status;
      void filters?.search;
      setUsers([]);
      setTotalPages(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters?.role, filters?.status, filters?.search]);

  const updateUserStatus = async (
    id: string,
    status: "active" | "inactive" | "banned",
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const deleteUser = async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    totalPages,
    isLoading,
    error,
    updateUserStatus,
    deleteUser,
    refetch: fetchUsers,
  };
};
