import { useState } from 'react';
import { UserTable, UserFilters, UserDetail } from './components';
import { useUsers } from './hooks';

export const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { users, totalPages, isLoading, updateUserStatus } = useUsers(page, filters);
  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage all registered users</p>
      </div>

      <UserFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <UserTable
          users={users}
          onUserClick={setSelectedUserId}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {selectedUser && (
        <UserDetail
          user={selectedUser}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusChange={(status) => updateUserStatus(selectedUser.id, status)}
        />
      )}
    </div>
  );
};
