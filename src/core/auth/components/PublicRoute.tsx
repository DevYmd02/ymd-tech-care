import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * @component PublicRoute
 * @description Guard component that protects public routes (e.g. Login, Register).
 * If user is already authenticated, redirects to the dashboard synchronously to prevent flickering.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard immediately
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
