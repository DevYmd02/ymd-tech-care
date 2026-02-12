import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// Context to manage dropdown state
interface DropdownContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within a DropdownMenu');

  return (
    <div onClick={context.toggle} className={`cursor-pointer ${className}`}>
      {children}
    </div>
  );
};

export const DropdownMenuContent: React.FC<{ children: React.ReactNode; align?: 'start' | 'end'; className?: string }> = ({ children, align = 'end', className = '' }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuContent must be used within a DropdownMenu');

  if (!context.isOpen) return null;

  const alignClass = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div className={`absolute ${alignClass} mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${className}`}>
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
};

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => {
  const context = useContext(DropdownContext);
  
  const handleClick = () => {
    if (onClick) onClick();
    context?.close();
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white cursor-pointer flex items-center ${className}`}
      role="menuitem"
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div className="h-px my-1 bg-gray-200 dark:bg-gray-700" />;
};