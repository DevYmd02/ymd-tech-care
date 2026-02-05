import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';

/**
 * ErrorFallback - UI component to display when an error occurs
 * Designed to be used with react-error-boundary
 */
export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const errorMessage = (error as Record<string, unknown>)?.message as string || 'An unexpected error occurred while loading this section.';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {errorMessage}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      >
        <RefreshCcw size={16} />
        <span>Reload Page</span>
      </button>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

/**
 * ErrorBoundary - Wrapper around react-error-boundary for backward compatibility
 * and consistent styling across the app.
 */
export const ErrorBoundary = ({ children, fallback, onReset }: ErrorBoundaryProps) => {
  const onResetHandler = onReset || (() => window.location.reload());

  if (fallback) {
    return (
      <ReactErrorBoundary fallback={fallback} onReset={onResetHandler}>
        {children}
      </ReactErrorBoundary>
    );
  }

  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onReset={onResetHandler}>
      {children}
    </ReactErrorBoundary>
  );
};
