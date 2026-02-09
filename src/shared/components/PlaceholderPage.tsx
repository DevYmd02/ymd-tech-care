import React from 'react';

/**
 * PlaceholderPage - Displays a "Coming Soon" message for unimplemented pages
 * @param title - The name of the page to display
 */
interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">Coming Soon</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
