"use client";

import { MainLayout } from "~/app/_components/main-layout";
import { ErrorBoundary, AnalyticsErrorFallback } from "~/app/_components";
import { AnalyticsDashboard } from "./analytics-dashboard";

export function AnalyticsPageClient() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            View comprehensive statistics about card usage and contestant performance
          </p>
        </div>
        
        <ErrorBoundary fallback={AnalyticsErrorFallback}>
          <AnalyticsDashboard />
        </ErrorBoundary>
      </div>
    </MainLayout>
  );
}