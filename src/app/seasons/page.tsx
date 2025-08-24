import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { HydrateClient, api } from "~/trpc/server";
import { SeasonsPageClient } from "./_components/seasons-page-client";
import { MainLayout } from "~/app/_components/main-layout";
import { ErrorBoundary } from "~/app/_components";

export default async function SeasonsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Check if user has permission to manage content
  if (!["PRODUCER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  // Prefetch seasons data
  void api.season.getAll.prefetch();

  return (
    <HydrateClient>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Season Management</h1>
            <p className="mt-2 text-gray-600">
              Manage your game show seasons and card decks
            </p>
          </div>
          <ErrorBoundary>
            <SeasonsPageClient />
          </ErrorBoundary>
        </div>
      </MainLayout>
    </HydrateClient>
  );
}