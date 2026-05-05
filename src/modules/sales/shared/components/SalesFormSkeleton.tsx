import React from 'react';

/**
 * @component SalesFormSkeleton
 * @description มาตรฐาน Skeleton UI สำหรับหน้าฟอร์มในโมดูล Sales (Quotation, Sales Order, Reservation, Approval)
 * เพื่อความลื่นไหลของ UX ในช่วงโหลดข้อมูล
 */
export const SalesFormSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
        
        {/* 1. Header Section Skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-9 w-full bg-gray-100 dark:bg-gray-800/40 rounded border border-gray-100 dark:border-gray-800/50" />
              </div>
            ))}
          </div>
        </div>

        {/* 2. Line Items Table Skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
             <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
          
          <div className="space-y-4">
             {/* Table Header */}
             <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded" />
             
             {/* Table Rows */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-12 flex-1 bg-gray-100 dark:bg-gray-800/30 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Summary Section Skeleton */}
        <div className="flex justify-end">
           <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full md:w-[400px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center">
                   <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
                   <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
                 <div className="h-7 w-1/4 bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
