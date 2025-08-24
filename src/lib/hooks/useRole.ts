import { useSession } from "next-auth/react";
import type { Role } from "~/lib/validations";

/**
 * Hook for role-based access control
 */
export function useRole() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const hasRole = (requiredRole: Role | Role[]): boolean => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return userRole === requiredRole;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const isHost = (): boolean => hasRole("HOST");
  const isProducer = (): boolean => hasRole("PRODUCER");
  const isAdmin = (): boolean => hasRole("ADMIN");
  
  const isProducerOrAdmin = (): boolean => hasAnyRole(["PRODUCER", "ADMIN"]);
  const canManageContent = (): boolean => hasAnyRole(["PRODUCER", "ADMIN"]);
  const canManageUsers = (): boolean => hasRole("ADMIN");

  return {
    userRole,
    hasRole,
    hasAnyRole,
    isHost,
    isProducer,
    isAdmin,
    isProducerOrAdmin,
    canManageContent,
    canManageUsers,
  };
}