import { useState, useEffect, useCallback } from 'react';

interface UseSearchKeyboardNavigationProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  isOpen: boolean;
  autoSelectFirst?: boolean;
}

/**
 * ⌨️ Shared Hook for Keyboard Navigation in Search Modals
 * Supports ArrowUp, ArrowDown, and Enter for quick selection.
 */
export function useSearchKeyboardNavigation<T>({
  items,
  onSelect,
  isOpen,
  autoSelectFirst = true
}: UseSearchKeyboardNavigationProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState<number>(autoSelectFirst ? 0 : -1);

  // Reset index when items change or modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(items.length > 0 && autoSelectFirst ? 0 : -1);
    }
  }, [items.length, isOpen, autoSelectFirst]);

  const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    if (!isOpen || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onSelect(items[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [items, selectedIndex, onSelect, isOpen]);

  // Optionally attach to window for global listening when open
  // but usually better to attach to the search input's onKeyDown
  
  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown
  };
}
