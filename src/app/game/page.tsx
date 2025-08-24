import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { GamePageClient } from "./_components/game-page-client";

export default async function GamePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Game is accessible to all authenticated users
  return (
    <HydrateClient>
      <GamePageClient />
    </HydrateClient>
  );
}

