/**
 * @file ItemBarcodeFormModal.tsx
 * @description Modal wrapper that redirects to ItemBarcodeForm page
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
}

export function ItemBarcodeFormModal({ isOpen, onClose, editId }: Props) {
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isOpen) {
            const path = editId 
                ? `/master-data/item-barcode?id=${editId}` 
                : '/master-data/item-barcode';
            navigate(path);
            onClose();
        }
    }, [isOpen, editId, navigate, onClose]);
    
    return null;
}
