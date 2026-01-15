/**
 * @file main.tsx
 * @description Application entry point
 * @purpose Bootstraps the React application with:
 *   - StrictMode for development checks
 *   - ThemeProvider for dark/light mode
 *   - BrowserRouter for client-side routing
 *   - ErrorBoundary for runtime error handling
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

