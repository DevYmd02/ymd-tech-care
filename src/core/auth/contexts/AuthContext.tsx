import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/core/auth/auth.service';
import type { LoginPayload, UserProfile } from '@/core/auth/auth.service';
import { setUnauthorizedHandler, AUTH_TOKEN_KEY, AUTH_PROFILE_KEY } from '@/core/api/api';
import { logger } from '@/shared/utils';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PROFILE_KEY);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // // Inactivity timeout setting (in milliseconds, e.g., 30 minutes)
  // const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

  // // Ref to store the timer ID
  // const logoutTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // const resetInactivityTimer = useCallback(() => {
  //   if (!isAuthenticated) return;
    
  //   if (logoutTimerRef.current) {
  //     clearTimeout(logoutTimerRef.current);
  //   }
    
  //   logoutTimerRef.current = setTimeout(() => {
  //     logger.warn('⏳ Session expired due to inactivity');
  //     clearAuthStorage();
  //     setIsAuthenticated(false);
  //     setUser(null);
  //     navigate('/auth/login', { replace: true, state: { reason: 'timeout' } });
  //   }, INACTIVITY_TIMEOUT);
  // }, [isAuthenticated, navigate, INACTIVITY_TIMEOUT]);

  // // Setup activity listeners
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     resetInactivityTimer();
  //     const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      
  //     const handleActivity = () => resetInactivityTimer();
      
  //     events.forEach(event => document.addEventListener(event, handleActivity));
      
  //     return () => {
  //       events.forEach(event => document.removeEventListener(event, handleActivity));
  //       if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  //     };
  //   }
  // }, [isAuthenticated, resetInactivityTimer]);

  const hasInitialized = React.useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (hasInitialized.current) return;
      
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
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
        const savedProfile = localStorage.getItem(AUTH_PROFILE_KEY);
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile);
            setUser(parsedProfile);
            setIsAuthenticated(true);
          } catch (e) {
            logger.error('Failed to parse cached user profile', e);
            clearAuthStorage();
            navigate('/auth/login', { replace: true, state: { reason: 'session_corrupted' } });
          }
        } else {
          // Token exists but no profile? Might be a legacy state or manual entry.
          // In a real app, we'd call /auth/me here. For now, we'll wait for next login.
          logger.warn('Token found but no cached profile - requiring re-login');
          clearAuthStorage();
        }
      }

      setIsLoading(false);
      hasInitialized.current = true;
    };

    initializeAuth();
  }, [navigate]);

  const login = useCallback(async (data: LoginPayload) => {
    try {
      const response = await AuthService.login(data);
      
      // AuthService.login returns LoginResponse with access_token field
      const token = response.access_token;
      
      if (token && typeof token === 'string') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        
        // 💡 CRITICAL: Ensure user profile is stringified and saved
        if (response.user) {
           const profileStr = JSON.stringify(response.user);
           localStorage.setItem(AUTH_PROFILE_KEY, profileStr);
           setUser(response.user);
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
