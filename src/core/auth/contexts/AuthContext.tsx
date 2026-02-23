import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/core/auth/auth.service';
import type { LoginPayload, UserProfile } from '@/core/auth/auth.service';
import { setUnauthorizedHandler } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_profile');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      // Register API unauthorized handler (Perfection Point #2)
      setUnauthorizedHandler(() => {
        clearAuthStorage();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/auth/login', { replace: true });
      });

      if (token) {
        // 💡 PERSISTENCE-FIRST STRATEGY
        // We restore the session from localStorage directly to avoid calling /auth/me (404 risk)
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            setUser(parsedProfile);
            setIsAuthenticated(true);
            logger.info('🔐 Session restored from local cache');
          } catch (e) {
            logger.error('Failed to parse cached user profile', e);
            clearAuthStorage();
          }
        } else {
          // Token exists but no profile? Might be a legacy state or manual entry.
          // In a real app, we'd call /auth/me here. For now, we'll wait for next login.
          logger.warn('Token found but no cached profile - requiring re-login');
          clearAuthStorage();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [navigate]);

  const login = useCallback(async (data: LoginPayload) => {
    try {
      const response = await AuthService.login(data);
      
      // AuthService.login returns LoginResponse with access_token field
      const token = response.access_token;
      
      if (token && typeof token === 'string') {
        localStorage.setItem('token', token);
        
        // 💡 CRITICAL: Ensure user profile is stringified and saved
        if (response.user) {
           const profileStr = JSON.stringify(response.user);
           localStorage.setItem('user_profile', profileStr);
           setUser(response.user);
           logger.info('👤 User profile persisted to localStorage');
        }
        
        setIsAuthenticated(true);
        navigate('/'); // Redirect to dashboard
      } else {
        logger.warn('⚠️ Login successful but no token found:', response);
      }
    } catch (error: unknown) {
      clearAuthStorage();
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/auth/login');
  }, [navigate]);

  const value = React.useMemo(() => ({
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  }), [isAuthenticated, isLoading, user, login, logout]);

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
