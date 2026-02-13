import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface StatusCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  disabled?: boolean;
  trueValue?: string | number | boolean;
  falseValue?: string | number | boolean;
  className?: string; // Optional for container styling
}

/**
 * StatusCheckbox Component
 * 
 * A reusable checkbox wrapper for react-hook-form that handles "status flags"
 * commonly stored as 'Y'/'N' in databases, instead of true/false.
 * 
 * @param name - The field name in the form data
 * @param control - The react-hook-form control object
 * @param label - The label text to display next to the checkbox
 * @param trueValue - The value to store when checked (default: 'Y')
 * @param falseValue - The value to store when unchecked (default: 'N')
 */
export const StatusCheckbox = <T extends FieldValues>({
  name,
  control,
  label,
  disabled = false,
  trueValue = 'Y',
  falseValue = 'N',
  className = ''
}: StatusCheckboxProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const isChecked = field.value === trueValue;
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          field.onChange(e.target.checked ? trueValue : falseValue);
        };

        return (
          <label 
            className={`flex items-center gap-2 cursor-pointer group select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          >
            <input 
              type="checkbox"
              checked={isChecked} 
              onChange={handleChange}
              disabled={disabled}
              className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-offset-1 transition-colors
                ${isChecked 
                  ? 'text-orange-500 bg-orange-500 border-orange-500 focus:ring-orange-500' 
                  : 'text-gray-400 focus:ring-gray-400'
                }
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            />
            {label && (
              <span className={`text-xs font-bold transition-colors ${isChecked ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {label}
              </span>
            )}
          </label>
        );
      }}
    />
  );
};
