/**
 * @file TabPanel.tsx
 * @description Reusable Tab Panel Component
 * 
 * @usage
 * ```tsx
 * <TabPanel
 *   tabs={[
 *     { id: 'detail', label: 'Detail', icon: <Info /> },
 *     { id: 'more', label: 'More', icon: <MoreHorizontal /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   {activeTab === 'detail' && <DetailContent />}
 *   {activeTab === 'more' && <MoreContent />}
 * </TabPanel>
 * ```
 */

import { type ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabPanelProps {
  /** Array of tab definitions */
  tabs: TabItem[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Content to render (typically conditionally based on activeTab) */
  children: ReactNode;
  /** Optional className for container */
  className?: string;
  /** Tab style variant */
  variant?: 'default' | 'underline' | 'pills';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TabPanel({
  tabs,
  activeTab,
  onTabChange,
  children,
  className = '',
  variant = 'default',
}: TabPanelProps) {
  // Style variants for tabs
  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    const baseStyles = 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none';
    
    if (isDisabled) {
      return `${baseStyles} text-gray-400 dark:text-gray-600 cursor-not-allowed`;
    }

    switch (variant) {
      case 'underline':
        return `${baseStyles} border-b-2 ${
          isActive
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
        }`;
      
      case 'pills':
        return `${baseStyles} rounded-lg ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`;
      
      default: // 'default'
        return `${baseStyles} rounded-t-lg border-b-2 ${
          isActive
            ? 'bg-gray-50 dark:bg-gray-800 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`;
    }
  };

  const containerStyles = variant === 'underline' 
    ? 'border-b border-gray-200 dark:border-gray-700'
    : variant === 'pills'
    ? 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg'
    : 'border-b border-gray-200 dark:border-gray-700';

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={`flex ${containerStyles}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={getTabStyles(activeTab === tab.id, !!tab.disabled)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        className="pt-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
      >
        {children}
      </div>
    </div>
  );
}
