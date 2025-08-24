import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { CardsPageClient } from "./_components/cards-page-client";

export default async function CardsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Check if user has permission to manage cards
  if (!["PRODUCER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <CardsPageClient />
    </HydrateClient>
  );
}



