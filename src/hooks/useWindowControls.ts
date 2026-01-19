import { useState, useEffect, useRef } from 'react';

interface UseWindowControlsReturn {
  isMaximized: boolean;
  isMinimized: boolean;
  isAnimating: boolean;
  isClosing: boolean;
  toggleMinimize: () => void;
  toggleMaximize: () => void;
  restore: () => void;
  resetWindow: () => void;
  handleClose: () => void;
}

export const useWindowControls = (isOpen: boolean, onClose: () => void): UseWindowControlsReturn => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const prevIsOpenRef = useRef(false);

  // Reset window state when modal re-opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
        setIsMaximized(true);
        setIsMinimized(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Animation effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsClosing(false);
        setIsAnimating(true);
      }, 10);
    } else {
      timer = setTimeout(() => {
        setIsAnimating(false);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const toggleMaximize = () => {
    setIsMinimized(false);
    setIsMaximized(prev => !prev);
  };

  const restore = () => {
    if (isMinimized) {
        setIsMinimized(false);
    }
  };

  const resetWindow = () => {
    setIsMaximized(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    // User requested instant close, so we remove the delay
    onClose();
    setIsClosing(false);
  };

  return {
    isMaximized,
    isMinimized,
    isAnimating,
    isClosing,
    toggleMinimize,
    toggleMaximize,
    restore,
    resetWindow,
    handleClose
  };
};
