'use client';

import React from 'react';
import { HeroSection } from '../components/HeroSection';

export const HeroSectionExample: React.FC = () => {
  const handleSignIn = () => {
    console.log('Sign in clicked');
    // In a real app, this would redirect to sign-in page
    // router.push('/signin');
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
    // In a real app, this would redirect to sign-up page
    // router.push('/signup');
  };

  const handleDashboard = () => {
    console.log('Dashboard clicked');
    // In a real app, this would redirect to dashboard
    // router.push('/dashboard');
  };

  return (
    <div className="min-h-screen">
      {/* Example 1: Unauthenticated User */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Unauthenticated User View</h2>
        <HeroSection
          isAuthenticated={false}
          onSignInClick={handleSignIn}
          onSignUpClick={handleSignUp}
        />
      </div>

      {/* Example 2: Authenticated User */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Authenticated User View</h2>
        <HeroSection
          isAuthenticated={true}
          user={{
            name: 'John Doe',
            email: 'john@example.com'
          }}
          onDashboardClick={handleDashboard}
        />
      </div>

      {/* Example 3: Custom Styling */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Custom Styled Version</h2>
        <HeroSection
          isAuthenticated={false}
          onSignInClick={handleSignIn}
          onSignUpClick={handleSignUp}
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        />
      </div>
    </div>
  );
};

export default HeroSectionExample;