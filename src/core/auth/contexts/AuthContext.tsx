import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/modules/auth/services/auth.service';
import type { LoginPayload } from '@/modules/auth/services/auth.service';
import { logger } from '@/shared/utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginPayload) => {
    try {
      const response = await AuthService.login(data);
      
      // Handle various common token field names since API specs are unclear
      const responseAny = response as unknown as { token?: string; accessToken?: string; access_token?: string };
      const token = responseAny.token || responseAny.accessToken || responseAny.access_token;
      
      // Check if response itself is the token string (less common but possible fallback)
      const possibleToken = typeof response === 'string' ? response : token;

      if (possibleToken && typeof possibleToken === 'string') {
        localStorage.setItem('token', possibleToken);
        setIsAuthenticated(true);
        navigate('/'); // Redirect to dashboard
      } else {
        // Fallback: If response doesn't have an obvious token but didn't throw error
        logger.warn('⚠️ Login successful but no token found in standard fields:', response);
        // Assuming success for now if backend didn't throw 4xx/5xx - logic can be refined later
      }
    } catch (error: unknown) {
      setIsAuthenticated(false);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    navigate('/auth/login');
  }, [navigate]);

  const value = React.useMemo(() => ({
    isAuthenticated,
    isLoading,
    login,
    logout
  }), [isAuthenticated, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
