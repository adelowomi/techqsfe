'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HeroSection } from '~/lib/animations';
import { LandingPageInitializer } from '~/lib/animations/landing-page-init';
import { api } from '~/trpc/react';

interface LandingPageProps {
  isAuthenticated: boolean;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: 'HOST' | 'PRODUCER' | 'ADMIN' | null;
  } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  isAuthenticated,
  user
}) => {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize landing page optimizations
  useEffect(() => {
    const initializePage = async () => {
      try {
        await LandingPageInitializer.initialize({
          preloadCriticalAssets: true,
          preloadBelowFoldComponents: true,
          applyProgressiveEnhancement: true,
          enablePerformanceMonitoring: process.env.NODE_ENV === 'development'
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize landing page:', error);
        // Continue with degraded experience
        setIsInitialized(true);
      }
    };

    initializePage();
  }, []);

  // Fetch user statistics if authenticated
  const { data: userStats } = api.user.getStats.useQuery(
    undefined,
    { 
      enabled: isAuthenticated && !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleSignIn = () => {
    router.push('/signin');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleDashboard = () => {
    router.push('/seasons'); // Redirect to main app section
  };

  const handleSeasons = () => {
    router.push('/seasons');
  };

  const handleAnalytics = () => {
    router.push('/analytics');
  };

  const handleCards = () => {
    router.push('/cards');
  };

  const handleGame = () => {
    router.push('/game');
  };

  return (
    <HeroSection
      isAuthenticated={isAuthenticated}
      user={user ? {
        id: user.id || undefined,
        name: user.name || undefined,
        email: user.email || undefined,
        role: user.role || undefined,
      } : undefined}
      userStats={userStats || undefined}
      onSignInClick={handleSignIn}
      onSignUpClick={handleSignUp}
      onDashboardClick={handleDashboard}
      onSeasonsClick={handleSeasons}
      onAnalyticsClick={handleAnalytics}
      onCardsClick={handleCards}
      onGameClick={handleGame}
    />
  );
};