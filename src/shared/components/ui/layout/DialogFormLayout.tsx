import React from 'react';
import { ModalLayout } from './ModalLayout';

interface DialogFormLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string; // Optional custom width (default to lg/max-w-4xl)
    isLoading?: boolean;
    subtitle?: string;
}

export const DialogFormLayout: React.FC<DialogFormLayoutProps> = (props) => {
    // Map existing width strings to variant sizes if they match common patterns
    let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg';
    if (props.width === 'max-w-md') size = 'sm';
    if (props.width === 'max-w-lg') size = 'md';
    if (props.width === 'max-w-6xl') size = 'xl';

    return (
        <ModalLayout 
            variant="dialog" 
            size={size} 
            {...props}
        >
            {props.children}
        </ModalLayout>
    );
};
