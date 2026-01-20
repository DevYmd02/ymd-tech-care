import React from 'react';

export interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'success' | 'danger' | 'default';
    disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, variant = 'default', disabled }) => {
    const baseClass = "flex items-center justify-center space-x-1 px-3 py-2 rounded border shadow-sm text-xs font-bold transition-all uppercase select-none w-full sm:w-auto";
    
    // Define styles including default state (outline/text) and hover state (filled)
    const variants = {
        primary: "bg-white dark:bg-gray-800 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-600 shadow-sm hover:shadow-md",
        success: "bg-white dark:bg-gray-800 border-green-600 text-green-600 dark:text-green-400 dark:border-green-500 hover:bg-green-600 dark:hover:bg-green-600 hover:text-white dark:hover:text-white hover:border-green-600 dark:hover:border-green-600 shadow-sm hover:shadow-md",
        danger: "bg-white dark:bg-gray-800 border-red-600 text-red-600 dark:text-red-400 dark:border-red-500 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white hover:border-red-600 dark:hover:border-red-600 shadow-sm hover:shadow-md",
        default: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-teal-600 dark:hover:bg-teal-600 hover:text-white dark:hover:text-white hover:border-teal-600 dark:hover:border-teal-600 hover:shadow-md"
    };

    return (
        <button 
            type="button" 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseClass} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {icon} <span>{label}</span>
        </button>
    );
};
