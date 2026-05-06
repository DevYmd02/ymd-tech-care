import React from 'react';
import { cn } from '@/shared/utils';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
  hasHeader?: boolean;
}

/**
 * TableSkeleton
 * A premium skeleton loader for tables to improve perceived performance
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 10,
  cols = 6,
  className,
  hasHeader = true,
}) => {
  return (
    <div className={cn("w-full animate-pulse overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900", className)}>
      {/* Skeleton Header */}
      {hasHeader && (
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div 
              key={`h-${i}`} 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded mr-4" 
              style={{ width: `${100 / cols}%`, maxWidth: i === 0 ? '60px' : 'none' }}
            />
          ))}
        </div>
      )}

      {/* Skeleton Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`r-${rowIndex}`} className="flex px-4 py-4 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={`c-${rowIndex}-${colIndex}`} 
                className={cn(
                  "h-3 bg-gray-100 dark:bg-gray-800 rounded mr-4",
                  rowIndex % 2 === 0 ? "opacity-80" : "opacity-40"
                )} 
                style={{ 
                  width: `${100 / cols}%`, 
                  maxWidth: colIndex === 0 ? '40px' : 'none' 
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
