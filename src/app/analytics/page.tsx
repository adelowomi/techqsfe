import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { AnalyticsPageClient } from "./_components/analytics-page-client";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Check if user has permission to view analytics
  if (!["PRODUCER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }
  return (
    <HydrateClient>
      <AnalyticsPageClient />
    </HydrateClient>
  );
}