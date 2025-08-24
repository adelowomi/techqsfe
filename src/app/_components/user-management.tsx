"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { AdminOnly } from "./role-guard";
import type { Role } from "~/lib/validations";

interface UserManagementProps {
  className?: string;
}

export function UserManagement({ className }: UserManagementProps) {
  const [selectedRole, setSelectedRole] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading, refetch } = api.user.getAll.useQuery({
    page,
    limit: 10,
    role: selectedRole === "ALL" ? undefined : selectedRole,
  });

  const { data: roleStats } = api.user.getRoleStats.useQuery();

  const updateRoleMutation = api.user.updateRole.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: newRole,
      });
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  return (
    <AdminOnly fallback={<div className="text-red-500">Access denied. Admin role required.</div>}>
      <div className={className}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          
          {/* Role Statistics */}
          {roleStats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {roleStats.map((stat) => (
                <div key={stat.role} className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">{stat.role}</div>
                  <div className="text-2xl font-bold">{stat.count}</div>
                </div>
              ))}
            </div>
          )}

          {/* Role Filter */}
          <div className="mb-4">
            <label htmlFor="role-filter" className="block text-sm font-medium mb-2">
              Filter by Role:
            </label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role | "ALL")}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="ALL">All Roles</option>
              <option value="HOST">Host</option>
              <option value="PRODUCER">Producer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div>Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seasons Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts Recorded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "PRODUCER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.seasons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        disabled={updateRoleMutation.isPending}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="HOST">Host</option>
                        <option value="PRODUCER">Producer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData?.pagination && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{" "}
              {Math.min(
                usersData.pagination.page * usersData.pagination.limit,
                usersData.pagination.total
              )}{" "}
              of {usersData.pagination.total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {usersData.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= usersData.pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}