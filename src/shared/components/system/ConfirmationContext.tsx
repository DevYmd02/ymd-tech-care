import React, { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import type { ConfirmationVariant } from './ConfirmationModal';

interface ConfirmationOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    hideCancel?: boolean;
    icon?: React.ElementType;
    onConfirm?: () => Promise<void>;
}

export interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({
        title: '',
        description: '',
    });
    const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
        setOptions(options);
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolver({ resolve });
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        if (options.onConfirm) {
            setIsLoading(true);
            try {
                await options.onConfirm();
                // If onConfirm succeeds, we consider it confirmed
                if (resolver) resolver.resolve(true);
                setIsOpen(false);
            } catch (error) {
                console.error("Async confirmation failed", error);
                // Keep modal open on error, stop loading
            } finally {
                setIsLoading(false);
            }
        } else {
            // Synchronous / Standard confirmation
            if (resolver) {
                resolver.resolve(true);
            }
            setIsOpen(false);
            setResolver(null);
        }
    }, [resolver, options]);

    const handleCancel = useCallback(() => {
        if (resolver) {
            resolver.resolve(false);
        }
        setIsOpen(false);
        setResolver(null);
    }, [resolver]);

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            <ConfirmationModal
                isOpen={isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={options.title}
                description={options.description}
                confirmText={options.confirmText}
                cancelText={options.cancelText}
                variant={options.variant}
                hideCancel={options.hideCancel}
                icon={options.icon}
                isLoading={isLoading}
            />
        </ConfirmationContext.Provider>
    );
};
