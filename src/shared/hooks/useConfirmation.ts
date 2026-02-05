import { useContext } from 'react';
import { ConfirmationContext, type ConfirmationContextType } from '@/shared/components/system/ConfirmationContext';

export const useConfirmation = (): ConfirmationContextType => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};
