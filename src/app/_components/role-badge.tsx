"use client";

import type { Role } from "~/lib/validations";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const getRoleStyles = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "PRODUCER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "HOST":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "👑";
      case "PRODUCER":
        return "🎬";
      case "HOST":
        return "🎤";
      default:
        return "👤";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyles(
        role
      )} ${className}`}
    >
      <span className="mr-1">{getRoleIcon(role)}</span>
      {role}
    </span>
  );
}