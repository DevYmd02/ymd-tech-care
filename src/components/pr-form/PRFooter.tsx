import React from 'react';
import { Save, Printer, FilePlus, X, CheckCircle, Copy, Search, Trash2 } from 'lucide-react';

interface ButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    danger?: boolean;
}

const ActionButton: React.FC<ButtonProps> = ({ icon, label, onClick, danger }) => {
    const baseClass = "flex items-center justify-center space-x-1 px-3 py-2 rounded border shadow-sm text-xs font-bold transition-all uppercase select-none w-full sm:w-auto";

    let colorClass = "bg-white border-gray-300 text-gray-700 hover:bg-green-600 hover:text-white hover:border-green-600 hover:shadow-md";

    if (danger) {
        colorClass = "bg-white border-gray-300 text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md";
    }

    return (
        <button type="button" onClick={onClick} className={`${baseClass} ${colorClass}`}>
            {icon} <span>{label}</span>
        </button>
    );
};

export const PRFooter: React.FC<{ onSave: () => void; onClose?: () => void }> = ({ onSave, onClose }) => (
    <div className="p-3 bg-gray-100 border-t flex flex-wrap items-center sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] gap-2">

        <ActionButton icon={<FilePlus size={14} />} label="New" />
        <ActionButton icon={<Save size={14} />} label="Save" onClick={onSave} />
        <ActionButton icon={<CheckCircle size={14} />} label="Approve" />
        <ActionButton icon={<Trash2 size={14} />} label="Delete" danger />
        <ActionButton icon={<Search size={14} />} label="Find" />
        <ActionButton icon={<Copy size={14} />} label="Copy" />
        <ActionButton icon={<Printer size={14} />} label="Print" />
        <ActionButton icon={<X size={14} />} label="Close" onClick={onClose} danger />

    </div>
);