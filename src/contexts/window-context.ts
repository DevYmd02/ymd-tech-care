import { createContext } from 'react';

export type WindowType = 'PR' | 'RFQ';

export interface WindowState {
  isOpen: boolean;
  props?: Record<string, unknown>;
}

export interface WindowContextType {
  windows: Record<WindowType, WindowState>;
  openWindow: (type: WindowType, props?: Record<string, unknown>) => void;
  closeWindow: (type: WindowType) => void;
}

export const WindowManagerContext = createContext<WindowContextType | undefined>(undefined);
