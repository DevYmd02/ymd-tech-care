import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { GlobalLoading } from '@/shared/components/system/GlobalLoading';
import { ROUTES } from '@/core/config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * @component ProtectedRoute
 * @description Guard component that protects private routes.
 * If user is not authenticated, redirects to login page.
 * Shows high-quality loading screen during state resolution.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // UX Guardrail: Show premium loading while initializing
  if (isLoading) {
    return <GlobalLoading message="กำลังตรวจสอบสิทธิ์ (Verifying access)..." />;
  }

  // If not authenticated, redirect to login with original path for post-login return
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={ROUTES.AUTH.LOGIN} 
        replace 
        state={{ from: location }} 
      />
    );
  }

  return <>{children}</>;
};
