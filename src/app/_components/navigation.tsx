"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRole } from "~/lib/hooks/useRole";
import { RoleBadge } from "./role-badge";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  CalendarDaysIcon,
  RectangleStackIcon,
  PlayIcon,
  ChartBarIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

export function Navigation() {
  const { data: session } = useSession();
  const { canManageContent, canManageUsers } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  if (!session) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: HomeIcon, show: true },
    { name: "Seasons", href: "/seasons", icon: CalendarDaysIcon, show: canManageContent() },
    { name: "Cards", href: "/cards", icon: RectangleStackIcon, show: canManageContent() },
    { name: "Game", href: "/game", icon: PlayIcon, show: canManageContent() },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon, show: canManageContent() },
    { name: "Admin", href: "/admin", icon: UserGroupIcon, show: canManageUsers() },
  ].filter(item => item.show);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                TechQ's
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive(item.href)
                        ? "border-indigo-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:ml-6 md:flex md:items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 truncate max-w-32">
                {session.user.name || session.user.email}
              </span>
              <RoleBadge role={session.user.role} />
            </div>
            <button
              onClick={() => signOut()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center space-x-3`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile user section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-base font-medium text-gray-800 truncate">
                  {session.user.name || session.user.email}
                </div>
                <div className="mt-1">
                  <RoleBadge role={session.user.role} />
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}