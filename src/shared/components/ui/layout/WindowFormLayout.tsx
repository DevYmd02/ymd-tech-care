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
}

export const WindowFormLayout: React.FC<WindowFormLayoutProps> = (props) => {
    return (
        <ModalLayout 
            variant="window" 
            size="full" 
            {...props}
        >
            {props.children}
        </ModalLayout>
    );
};
