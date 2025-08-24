"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Role } from "~/lib/validations";

const roleDescriptions = {
  HOST: "Basic user with access to game features",
  PRODUCER: "Can manage seasons and cards",
  ADMIN: "Full administrative access to all features",
};

export function RoleSwitcher() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!session?.user) {
    return null;
  }

  const currentRole = session.user.role;

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === currentRole) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/update-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update role");
        return;
      }

      // Update the session with new role
      await update({
        ...session,
        user: {
          ...session.user,
          role: newRole,
        },
      });

      // Refresh the page to update UI components that depend on role
      router.refresh();
    } catch (error) {
      setError("An error occurred while updating your role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Temporary Role Switcher (Development Only)
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-3">
              Current role: <span className="font-semibold">{currentRole}</span> - {roleDescriptions[currentRole]}
            </p>
            
            {error && (
              <div className="mb-3 text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <p className="font-medium">Switch to:</p>
              <div className="flex flex-wrap gap-2">
                {(["HOST", "PRODUCER", "ADMIN"] as Role[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    disabled={loading || role === currentRole}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      role === currentRole
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                    }`}
                    title={roleDescriptions[role]}
                  >
                    {loading ? "..." : role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}