/**
 * @file AppProvider.tsx
 * @description Compound Provider that wraps all global providers for the application
 * @purpose Centralizes all provider wrappers to clean up the root component and improve maintainability
 */

import { StrictMode, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { ThemeProvider } from '@/core/contexts/ThemeContext';
import { ErrorBoundary } from '@system/ErrorBoundary';
import { ConfirmationProvider } from '@system/ConfirmationContext';

const NON_RETRYABLE_STATUSES = [400, 401, 403, 404, 422];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status && NON_RETRYABLE_STATUSES.includes(status)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // 1s → 2s → 4s (max 8s)
    },
    mutations: {
      retry: false, // ห้าม retry mutation เด็ดขาด — อาจทำให้ insert/update ซ้ำ
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider - Compound provider that wraps all global providers
 * @param children - The child components to wrap with providers
 * 
 * Provider hierarchy:
 * 1. StrictMode - Development checks
 * 2. ErrorBoundary - Runtime error handling
 * 3. QueryClientProvider - React Query for data fetching
 * 4. ThemeProvider - Dark/light mode theming
 * 5. BrowserRouter - Client-side routing
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ConfirmationProvider>
            <ThemeProvider>
              <BrowserRouter>
                {children}
              </BrowserRouter>
            </ThemeProvider>
          </ConfirmationProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

export default AppProvider;
