import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

export interface CustomDateTimeInputProps {
    value: string; // YYYY-MM-DDTHH:mm
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const CustomDateTimeInput: React.FC<CustomDateTimeInputProps> = ({
    value,
    onChange,
    placeholder = 'dd/mm/yyyy --:--',
    className = '',
    disabled = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper to format YYYY-MM-DDTHH:mm to DD/MM/YYYY HH:mm
    const formatDisplayDateTime = (val?: string) => {
        if (!val) return '';
        if (val.includes('T')) {
            const [datePart, timePart] = val.split('T');
            const [y, m, d] = datePart.split('-');
            
            const [hh, mm] = timePart.split(':');
            let hours = parseInt(hh, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const hStr = hours < 10 ? '0' + hours : hours;
            
            return `${d}/${m}/${y} ${hStr}:${mm} ${ampm}`;
        }
        return val;
    };

    return (
        <div className="relative w-full">
            {/* 1. Visible Formatted Display */}
            <input
                type="text"
                readOnly
                placeholder={placeholder}
                value={formatDisplayDateTime(value)}
                disabled={disabled}
                onClick={() => {
                    if (!disabled && inputRef.current) {
                        try {
                            inputRef.current.showPicker();
                        } catch (err) {
                            void err;
                        }
                    }
                }}
                className={`${className} cursor-pointer pr-10`}
            />

            {/* 2. Hidden Native Input for Picker */}
            <input
                type="datetime-local"
                ref={inputRef}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ colorScheme: 'light dark' }}
                onClick={(e) => {
                    if (!disabled && 'showPicker' in HTMLInputElement.prototype) {
                        try {
                            e.currentTarget.showPicker();
                        } catch (err) {
                            void err;
                        }
                    }
                }}
            />

            {/* 3. Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-gray-400">
                <Calendar className="w-4 h-4" />
            </div>
        </div>
    );
};
