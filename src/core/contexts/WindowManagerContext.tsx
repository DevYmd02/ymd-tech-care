import React, { useState, type ReactNode } from 'react';
import { WindowManagerContext, type WindowType, type WindowState } from './window-context';

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Record<WindowType, WindowState>>({
    PR: { isOpen: false },
    RFQ: { isOpen: false },
  });

  const openWindow = (type: WindowType, props?: Record<string, unknown>) => {
    setWindows(prev => ({
      ...prev,
      [type]: { isOpen: true, props }
    }));
  };

  const closeWindow = (type: WindowType) => {
    setWindows(prev => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false } // Keep props for a moment if needed, or clear them
    }));
  };

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow, closeWindow }}>
      {children}
    </WindowManagerContext.Provider>
  );
};
