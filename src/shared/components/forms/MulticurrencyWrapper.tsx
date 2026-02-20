import React from 'react';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

interface MulticurrencyWrapperProps<T extends FieldValues> {
  control?: Control<T>; 
  name: Path<T>; 
  label?: string;
  children: React.ReactNode; 
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  layout?: 'stacked' | 'inline';
  disabled?: boolean;
}

const MulticurrencyUI: React.FC<{
    isChecked: boolean;
    onToggle: (checked: boolean) => void;
    label: string;
    children: React.ReactNode;
    name: string;
    layout?: 'stacked' | 'inline';
    disabled?: boolean;
}> = ({ isChecked, onToggle, label, children, name, layout = 'stacked', disabled = false }) => {
    if (layout === 'inline') {
        return (
            <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-2 shrink-0">
                    <input
                        type="checkbox"
                        id={name}
                        checked={isChecked}
                        onChange={(e) => onToggle(e.target.checked)}
                        disabled={disabled}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        {label}
                    </label>
                </div>
                {isChecked && (
                    <div className="flex-1 flex items-center gap-4">
                        {children}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md">
                <input
                    type="checkbox"
                    id={name}
                    checked={isChecked}
                    onChange={(e) => onToggle(e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    {label}
                </label>
            </div>

            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isChecked ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden min-h-0">
            <div className="p-1 pb-4 pt-2">
                {children}
            </div>
        </div>
      </div>
        </div>
    );
};

const RHFMulticurrencyWrapper = <T extends FieldValues>({ control, name, label, children, layout = 'stacked', disabled }: MulticurrencyWrapperProps<T>) => {
    const { field } = useController({
        name,
        control,
    });
    return (
        <MulticurrencyUI 
            isChecked={!!field.value} 
            onToggle={field.onChange} 
            label={label || "ระบุสกุลเงินต่างประเทศ (Multicurrency)"} 
            name={name}
            layout={layout}
            disabled={disabled}
        >
            {children}
        </MulticurrencyUI>
    );
};

export const MulticurrencyWrapper = <T extends FieldValues>(props: MulticurrencyWrapperProps<T>) => {
  if (props.control) {
    return <RHFMulticurrencyWrapper {...props} />;
  }
  
  return (
    <MulticurrencyUI 
        isChecked={!!props.checked} 
        onToggle={props.onCheckedChange || (() => {})} 
        label={props.label || "ระบุสกุลเงินต่างประเทศ (Multicurrency)"}
        name={props.name}
        layout={props.layout}
        disabled={props.disabled}
    >
        {props.children}
    </MulticurrencyUI>
  );
};
