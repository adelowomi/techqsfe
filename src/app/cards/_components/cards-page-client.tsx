"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { DeckView } from "./deck-view";
import { MainLayout } from "~/app/_components/main-layout";
import { ErrorBoundary, CardErrorFallback, DeckLoadingState } from "~/app/_components";
import type { Difficulty } from "~/lib/types";

function CardsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const seasonId = searchParams.get("season");
  const difficulty = searchParams.get("difficulty") as Difficulty;

  if (!seasonId || !difficulty) {
    router.push("/seasons");
    return null;
  }

  const handleBack = () => {
    router.push(`/seasons?selected=${seasonId}`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary fallback={CardErrorFallback}>
          <DeckView
            seasonId={seasonId}
            difficulty={difficulty}
            onBack={handleBack}
          />
        </ErrorBoundary>
      </div>
    </MainLayout>
  );
}

export function CardsPageClient() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DeckLoadingState />
        </div>
      </MainLayout>
    }>
      <CardsPageContent />
    </Suspense>
  );
}