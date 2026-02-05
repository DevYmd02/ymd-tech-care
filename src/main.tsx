/**
 * @file main.tsx
 * @description Application entry point
 * @purpose Bootstraps the React application with the AppProvider compound provider
 */

import { createRoot } from 'react-dom/client';
import { AppProvider } from '@/core/providers/AppProvider';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>,
);
