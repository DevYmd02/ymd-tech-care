import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'gray';
  icon?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  className = '',
  headerClassName = '',
  accentColor = 'blue',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400',
  };

  const borderClasses = {
    blue: 'border-blue-200 dark:border-blue-900/30',
    emerald: 'border-emerald-200 dark:border-emerald-900/30',
    amber: 'border-amber-200 dark:border-amber-900/30',
    red: 'border-red-200 dark:border-red-900/30',
    gray: 'border-gray-200 dark:border-gray-700',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border ${borderClasses[accentColor]} rounded-sm overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${headerClassName}`}
      >
        <div className="flex items-center gap-2">
          {icon && <div className={accentClasses[accentColor]}>{icon}</div>}
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {title}
          </h3>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* Content */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
};
