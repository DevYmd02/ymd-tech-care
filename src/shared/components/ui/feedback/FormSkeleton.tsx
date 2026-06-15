import React from 'react';
import { cn } from '@/shared/utils';

interface FormSkeletonProps {
  rows?: number;
  className?: string;
}

/**
 * FormSkeleton
 * A premium skeleton loader for forms and modals to improve perceived performance
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  rows = 4,
  className,
}) => {
  return (
    <div className={cn("w-full animate-pulse space-y-6", className)}>
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-1/4 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`input-${i}`} className="flex flex-col gap-2">
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-800"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table / Lines Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={`th-${i}`} 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded mr-4" 
              style={{ width: '20%' }}
            />
          ))}
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`tr-${rowIndex}`} className="flex px-4 py-4 items-center">
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <div 
                  key={`td-${rowIndex}-${colIndex}`} 
                  className={cn(
                    "h-3 bg-gray-100 dark:bg-gray-800 rounded mr-4",
                    rowIndex % 2 === 0 ? "opacity-80" : "opacity-40"
                  )} 
                  style={{ width: '20%' }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
