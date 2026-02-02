import { Loader2 } from 'lucide-react';

/**
 * GlobalLoading - Full screen loading component
 * Used as a fallback for React.Suspense during route transitions
 */
export const GlobalLoading = ({ message = 'Loading System...' }: { message?: string }) => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-50 fixed top-0 left-0">
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <Loader2 
          className="h-12 w-12 text-blue-600 dark:text-blue-500 animate-spin mb-4" 
          strokeWidth={2}
        />
        
        {/* Loading Text */}
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          {message}
        </h3>
        
        {/* Optional: Brand or Subtitle */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          YMD Tech Care ERP
        </p>
      </div>
    </div>
  );
};
