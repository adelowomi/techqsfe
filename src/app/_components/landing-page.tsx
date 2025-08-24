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
    // Route based on user role
    if (user?.role === 'ADMIN') {
      router.push('/admin');
    } else if (user?.role === 'PRODUCER') {
      router.push('/seasons');
    } else {
      router.push('/game'); // HOST users go to game page
    }
  };

  const handleSeasons = () => {
    // Only allow PRODUCER and ADMIN to access seasons
    if (user?.role === 'PRODUCER' || user?.role === 'ADMIN') {
      router.push('/seasons');
    } else {
      // Show an alert or redirect to appropriate page
      alert('You need Producer or Admin privileges to manage seasons.');
    }
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