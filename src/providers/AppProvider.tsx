/**
 * @file AppProvider.tsx
 * @description Compound Provider that wraps all global providers for the application
 * @purpose Centralizes all provider wrappers to clean up the root component and improve maintainability
 */

import { StrictMode, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
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
          <ThemeProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

export default AppProvider;
