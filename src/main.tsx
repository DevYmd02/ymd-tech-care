/**
 * @file main.tsx
 * @description Application entry point
 * @purpose Bootstraps the React application with:
 *   - StrictMode for development checks
 *   - ThemeProvider for dark/light mode
 *   - BrowserRouter for client-side routing
 *   - ErrorBoundary for runtime error handling
 *   - QueryClientProvider for React Query
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import './index.css';
import App from './App';

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
