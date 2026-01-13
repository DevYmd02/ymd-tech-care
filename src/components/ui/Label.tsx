import React from 'react';

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-bold text-gray-700 mb-1">
    {children}
  </label>
);