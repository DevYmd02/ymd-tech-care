import React from 'react';
import { Save, Printer, FilePlus, X, CheckCircle, Copy, Search, Trash2 } from 'lucide-react';
import { ActionButton } from '../../../../components/ui/ActionButton';

interface VendorFooterProps {
    onSave: () => void;
    onClose: () => void;
    isSaving?: boolean;
}

export const VendorFooter: React.FC<VendorFooterProps> = ({ onSave, onClose, isSaving }) => (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] gap-2">
        <ActionButton icon={<FilePlus size={14} />} label="New" variant="default" />
        <ActionButton icon={<Save size={14} />} label="Save" onClick={onSave} disabled={isSaving} variant="primary" />
        <ActionButton icon={<CheckCircle size={14} />} label="Approve" variant="success" />
        <ActionButton icon={<Trash2 size={14} />} label="Delete" variant="danger" />
        <ActionButton icon={<Search size={14} />} label="Find" variant="default" />
        <ActionButton icon={<Copy size={14} />} label="Copy" variant="default" />
        <ActionButton icon={<Printer size={14} />} label="Print" variant="default" />
        <ActionButton icon={<X size={14} />} label="Close" onClick={onClose} variant="danger" />
    </div>
);
