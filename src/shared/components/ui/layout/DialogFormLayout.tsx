import React from 'react';
import { ModalLayout } from './ModalLayout';

interface DialogFormLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
    isLoading?: boolean;
    subtitle?: string;
    headerColor?: string;
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
            headerColor={props.headerColor}
            isOpen={props.isOpen}
            onClose={props.onClose}
            title={props.title}
            titleIcon={props.titleIcon}
            footer={props.footer}
            isLoading={props.isLoading}
            subtitle={props.subtitle}
        >
            {props.children}
        </ModalLayout>
    );
};
