import { useContext } from 'react';
import { WindowManagerContext } from '@/core/contexts/window-context';
import type { WindowContextType } from '@/core/contexts/window-context';

export const useWindowManager = (): WindowContextType => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
