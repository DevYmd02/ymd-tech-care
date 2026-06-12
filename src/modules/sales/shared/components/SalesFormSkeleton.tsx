import React from 'react';

/**
 * @component SalesFormSkeleton
 * @description มาตรฐาน Skeleton UI ระดับ Premium สำหรับหน้าฟอร์มในโมดูล Sales
 * ใช้ CSS Shimmer Effect แทน Pulse ธรรมดาเพื่อ UX ที่ลื่นไหลและดูทันสมัย
 */
export const SalesFormSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(226, 232, 240, 0) 0%, 
            rgba(226, 232, 240, 0.5) 50%, 
            rgba(226, 232, 240, 0) 100%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
        .dark .shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(30, 41, 59, 0) 0%, 
            rgba(51, 65, 85, 0.4) 50%, 
            rgba(30, 41, 59, 0) 100%);
          background-size: 1000px 100%;
        }
      `}} />

      <div className="w-full space-y-6">
        
        {/* 1. Header Section Skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 space-y-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="shimmer-bg absolute inset-0 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="h-7 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-10 w-full bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800/50" />
              </div>
            ))}
          </div>
        </div>

        {/* 2. Line Items Table Skeleton */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 space-y-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="shimmer-bg absolute inset-0 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6">
             <div className="h-7 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
             <div className="h-10 w-36 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg" />
          </div>
          
          <div className="space-y-3">
             {/* Table Header */}
             <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-lg" />
             
             {/* Table Rows */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-14 flex-1 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100/50 dark:border-gray-800/30" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Summary Section Skeleton */}
        <div className="flex justify-end">
           <div className="bg-white dark:bg-gray-900 rounded-xl p-8 w-full md:w-[450px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5 relative overflow-hidden">
              <div className="shimmer-bg absolute inset-0 pointer-events-none" />
              
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                   <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                   <div className="h-4 w-1/4 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                 <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                 <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
