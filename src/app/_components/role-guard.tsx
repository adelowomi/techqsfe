"use client";

import { useRole } from "~/lib/hooks/useRole";
import type { Role } from "~/lib/validations";
import type { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: Role | Role[];
  fallback?: ReactNode;
  requireAny?: boolean; // If true, user needs ANY of the roles, if false, user needs ALL roles
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard({ 
  children, 
  requiredRole, 
  fallback = null,
  requireAny = true 
}: RoleGuardProps) {
  const { hasRole, hasAnyRole } = useRole();

  if (!requiredRole) {
    return <>{children}</>;
  }

  const hasAccess = Array.isArray(requiredRole) 
    ? (requireAny ? hasAnyRole(requiredRole) : requiredRole.every(role => hasRole(role)))
    : hasRole(requiredRole);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Convenience components for specific roles
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole="ADMIN" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ProducerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole="PRODUCER" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ProducerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole={["PRODUCER", "ADMIN"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function HostOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole="HOST" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}