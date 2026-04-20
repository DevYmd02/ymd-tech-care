import React from 'react';
import { ModalLayout } from './ModalLayout';

interface WindowFormLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon: React.ReactNode;
    headerColor?: string; // e.g., 'bg-blue-600'
    children: React.ReactNode;
    footer?: React.ReactNode;
    isLoading?: boolean;
}

export const WindowFormLayout: React.FC<WindowFormLayoutProps> = ({ isLoading, ...props }) => {
    return (
        <ModalLayout 
            variant="window" 
            size="full" 
            isLoading={isLoading}
            {...props}
        >
            {props.children}
        </ModalLayout>
    );
};
