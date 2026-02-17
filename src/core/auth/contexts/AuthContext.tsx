import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/modules/auth/services/auth.service';
import type { LoginPayload, UserProfile } from '@/modules/auth/services/auth.service';
import { logger } from '@/shared/utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token and user on mount
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');
    
    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as UserProfile);
        } catch (e) {
          logger.error('Failed to parse user profile', e);
          localStorage.removeItem('user_profile');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginPayload) => {
    try {
      const response = await AuthService.login(data);
      
      // AuthService.login returns LoginResponse with access_token field
      const token = response.access_token;
      
      if (token && typeof token === 'string') {
        localStorage.setItem('token', token);
        
        // Save user profile
        if (response.user) {
           setUser(response.user);
           localStorage.setItem('user_profile', JSON.stringify(response.user));
        }
        
        setIsAuthenticated(true);
        navigate('/'); // Redirect to dashboard
      } else {
        // If no token but didn't throw error - log warning
        logger.warn('⚠️ Login successful but no token found:', response);
      }
    } catch (error: unknown) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
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
