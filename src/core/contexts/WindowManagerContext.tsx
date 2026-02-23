import React, { useState, type ReactNode } from 'react';
import { WindowManagerContext, type WindowType, type WindowState } from './window-context';

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Record<WindowType, WindowState>>({});

  const openWindow = (type: WindowType, props?: Record<string, unknown>) => {
    setWindows(prev => ({
      ...prev,
      [type]: { isOpen: true, props }
    }));
  };

  const closeWindow = (type: WindowType) => {
    setWindows(prev => {
      // If the window doesn't exist in state, no need to update
      if (!prev[type]) return prev;
      return {
        ...prev,
        [type]: { ...prev[type], isOpen: false }
      };
    });
  };

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow, closeWindow }}>
      {children}
    </WindowManagerContext.Provider>
  );
};
