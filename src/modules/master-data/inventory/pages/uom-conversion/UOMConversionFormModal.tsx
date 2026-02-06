/**
 * @file UOMConversionFormModal.tsx
 * @description Modal wrapper that redirects to UOMConversionForm page
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
}

export function UOMConversionFormModal({ isOpen, onClose, editId }: Props) {
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isOpen) {
            const path = editId 
                ? `/master-data/uom-conversion?id=${editId}` 
                : '/master-data/uom-conversion';
            navigate(path);
            onClose();
        }
    }, [isOpen, editId, navigate, onClose]);
    
    return null;
}
