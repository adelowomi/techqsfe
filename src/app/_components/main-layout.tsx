"use client";

import { Navigation } from "./navigation";
import { Breadcrumb } from "./breadcrumb";
import { ErrorBoundary } from "./error-boundary";
import { RoleSwitcher } from "./role-switcher";
import { useSession } from "next-auth/react";

interface MainLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

export function MainLayout({ 
  children, 
  showBreadcrumbs = true, 
  className = "min-h-screen bg-gray-50" 
}: MainLayoutProps) {
  const { data: session } = useSession();

  return (
    <div className={className}>
      {session && <Navigation />}
      
      {session && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <RoleSwitcher />
        </div>
      )}
      
      {session && showBreadcrumbs && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ErrorBoundary>
              <Breadcrumb />
            </ErrorBoundary>
          </div>
        </div>
      )}
      
      <main className="flex-1">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}