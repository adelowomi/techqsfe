"use client";

import { UserManagement } from "~/app/_components/user-management";
import { AdminOnly } from "~/app/_components/role-guard";
import { MainLayout } from "~/app/_components/main-layout";

export default function AdminPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminOnly fallback={
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        }>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and system settings</p>
          </div>
          
          <UserManagement className="bg-white rounded-lg shadow-md p-6" />
        </AdminOnly>
      </div>
    </MainLayout>
  );
}