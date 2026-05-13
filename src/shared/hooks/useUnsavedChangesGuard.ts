import { useEffect, useCallback } from 'react';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

/**
 * 🛡️ useUnsavedChangesGuard
 * 
 * A hook to prevent data loss by warning users when they try to navigate away
 * with unsaved changes (dirty form).
 * 
 * Handles:
 * 1. Browser-level events (Tab close, Refresh, Back button)
 * 2. React Router navigation (Internal menu changes)
 * 3. Manual close actions (Modal close buttons)
 */
interface UseUnsavedChangesGuardProps {
    isDirty: boolean;
    onSafeClose: () => void;
    message?: string;
}

export const useUnsavedChangesGuard = ({
    isDirty,
    onSafeClose,
    message = 'คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้โดยไม่บันทึกใช่หรือไม่?'
}: UseUnsavedChangesGuardProps) => {
    
    // 🌐 1. Browser-level Guard (onbeforeunload)
    // This triggers when the user refreshes or closes the tab.
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                // Modern browsers require setting returnValue to a string, 
                // though most display their own generic message.
                e.returnValue = message; 
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, message]);

    // 🚀 2. React Router Guard (useBlocker)
    // NOTE: This is currently disabled because the app uses <BrowserRouter>.
    // To enable this, the app must be refactored to use createBrowserRouter / RouterProvider.
    /*
    const blocker = useBlocker(
        ({ nextLocation, currentLocation }) => 
            isDirty && nextLocation.pathname !== currentLocation.pathname
    );
    */

    const { confirm } = useConfirmation();

    // 🖱️ 3. Manual Close Handler
    // Use this for the "Close" button in your modals.
    const handleCloseAttempt = useCallback(async () => {
        if (!isDirty) {
            onSafeClose();
            return;
        }

        const confirmed = await confirm({
            title: 'ยืนยันการปิดโดยไม่บันทึก',
            description: message,
            confirmText: 'ใช่, ปิดหน้านี้',
            cancelText: 'ยกเลิก',
            variant: 'warning'
        });

        if (confirmed) {
            onSafeClose();
        }
    }, [isDirty, onSafeClose, message, confirm]);

    return {
        blocker: null, // Return null to avoid breaking components that destructure it
        handleCloseAttempt,
        isDirty
    };
};
