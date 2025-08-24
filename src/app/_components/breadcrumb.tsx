"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import { api } from "~/trpc/react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const seasonId = searchParams.get("season");
  const difficulty = searchParams.get("difficulty");
  
  // Get season data if we have a seasonId
  const { data: season } = api.season.getById.useQuery(
    { id: seasonId! },
    { enabled: !!seasonId }
  );

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/" }
    ];

    const pathSegments = pathname.split("/").filter(Boolean);
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const href = "/" + pathSegments.slice(0, i + 1).join("/");
      
      switch (segment) {
        case "seasons":
          breadcrumbs.push({ label: "Seasons", href });
          break;
        case "cards":
          if (season) {
            breadcrumbs.push({ 
              label: "Seasons", 
              href: "/seasons" 
            });
            breadcrumbs.push({ 
              label: season.name, 
              href: `/seasons?selected=${seasonId}` 
            });
            if (difficulty) {
              breadcrumbs.push({ 
                label: `${difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} Deck`
              });
            }
          } else {
            breadcrumbs.push({ label: "Cards" });
          }
          break;
        case "game":
          breadcrumbs.push({ label: "Game", href });
          break;
        case "analytics":
          breadcrumbs.push({ label: "Analytics", href });
          break;
        case "admin":
          breadcrumbs.push({ label: "Admin", href });
          break;
        default:
          // Capitalize first letter for unknown segments
          if (segment) {
            breadcrumbs.push({ 
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              href 
            });
          }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/" className="text-gray-400 hover:text-gray-500">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {breadcrumbs.slice(1).map((breadcrumb, index) => (
          <li key={breadcrumb.label}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className="ml-4 text-sm font-medium text-gray-900">
                  {breadcrumb.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}