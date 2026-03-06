import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

export interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  className = '',
  disabled = false,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Helper to format YYYY-MM-DD to DD/MM/YYYY
  const formatDisplayDate = (val?: string) => {
    if (!val) return '';
    if (val.includes('-') && val.length >= 10) {
      const [y, m, d] = val.split('-');
      return `${d.substring(0, 2)}/${m}/${y}`;
    }
    return val;
  };

  return (
    <div className="relative w-full h-full">
      {/* 1. Visible Text Input */}
      <input
        type="text"
        readOnly
        placeholder={placeholder}
        value={formatDisplayDate(value)}
        disabled={disabled}
        onClick={() => {
          if (!disabled && dateInputRef.current) {
            try {
              dateInputRef.current.showPicker();
            } catch (err) {
              void err;
            }
          }
        }}
        className={`${className} cursor-pointer pr-8`}
      />
      
      {/* 2. Hidden Native Input overlay for click/picker */}
      <input
        type="date"
        ref={dateInputRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ colorScheme: 'dark' }}
      />
      
      {/* 3. Icon */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center justify-center text-slate-400">
        <Calendar className="w-4 h-4" />
      </div>
    </div>
  );
};
