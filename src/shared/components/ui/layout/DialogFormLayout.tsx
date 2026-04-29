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
    headerRight?: React.ReactNode;
}

export const DialogFormLayout: React.FC<DialogFormLayoutProps> = (props) => {
    let size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' = 'lg';
    if (props.width === 'max-w-md') size = 'sm';
    if (props.width === 'max-w-lg') size = 'md';
    if (props.width === 'max-w-6xl' || props.width === 'max-w-7xl' || props.width === 'max-w-[1200px]') size = 'xl';
    if (props.width === 'max-w-[1600px]') size = '2xl';
    if (props.width === 'max-w-[1800px]') size = '3xl';

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
            headerRight={props.headerRight}
        >
            {props.children}
        </ModalLayout>
    );
};
