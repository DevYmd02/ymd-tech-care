/**
 * @file ItemMasterFormModal.tsx
 * @description Modal wrapper that redirects to ItemMasterForm page
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
}

export function ItemMasterFormModal({ isOpen, onClose, editId }: Props) {
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isOpen) {
            const path = editId 
                ? `/master-data/item?id=${editId}` 
                : '/master-data/item';
            navigate(path);
            onClose();
        }
    }, [isOpen, editId, navigate, onClose]);
    
    return null;
}
