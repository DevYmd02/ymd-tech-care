import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    X, 
    Plus, 
    Trash2, 
    Edit2, 
    Check, 
    Loader2, 
    AlertCircle 
} from 'lucide-react';
import { useToast } from '@ui/feedback/Toast';
import { DocLinkICService } from '../services/doc-link-ic.service';
import type { DocLinkIC, DocLinkICItem } from '../types/doc-link-ic.types';

interface DocLinkICItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentType: DocLinkIC | null;
}

export function DocLinkICItemModal({ isOpen, onClose, parentType }: DocLinkICItemModalProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Local state for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<DocLinkICItem> | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Queries
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['doc-link-ic-items', parentType?.docu_type_id],
        queryFn: () => DocLinkICService.getItems(parentType!.docu_type_id),
        enabled: !!parentType && isOpen,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Omit<DocLinkICItem, 'docu_item_id'>) => DocLinkICService.createItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic-items', parentType?.docu_type_id] });
            toast('เพิ่มรายการเอกสารสำเร็จ', 'success');
            setIsAdding(false);
            setEditData(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DocLinkICItem> }) => DocLinkICService.updateItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic-items', parentType?.docu_type_id] });
            toast('แก้ไขรายการเอกสารสำเร็จ', 'success');
            setEditingId(null);
            setEditData(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => DocLinkICService.removeItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic-items', parentType?.docu_type_id] });
            toast('ลบรายการเอกสารสำเร็จ', 'success');
        },
    });

    if (!isOpen || !parentType) return null;

    // Handlers
    const handleStartAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        // Find next item no (max + 1)
        const nextNo = items.length > 0 ? Math.max(...items.map((i: DocLinkICItem) => i.docu_item_no)) + 1 : 1;
        setEditData({
            docu_type_id: parentType.docu_type_id,
            docu_item_no: nextNo,
            docu_item_name: '',
            stock_effect_ic: parentType.stock_effect_ic || 0,
            is_active: true,
        });
    };

    const handleStartEdit = (item: DocLinkICItem) => {
        setEditingId(item.docu_item_id);
        setEditData({ ...item });
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!editData?.docu_item_name) {
            toast('กรุณาระบุชื่อรายการ', 'error');
            return;
        }

        if (isAdding) {
            createMutation.mutate(editData as Omit<DocLinkICItem, 'docu_item_id'>);
        } else if (editingId) {
            updateMutation.mutate({ id: editingId, data: editData });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('ยืนยันการลบรายการย่อย?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Plus size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                จัดการรายการเอกสาร
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {parentType.docu_type_code} — {parentType.docu_name_th || parentType.docu_name_en}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    
                    {/* Add Button Row */}
                    {!isAdding && !editingId && (
                        <button
                            onClick={handleStartAdd}
                            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            เพิ่มรายการใหม่
                        </button>
                    )}

                    {/* Items Table */}
                    <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-bold">
                                <tr>
                                    <th className="px-4 py-3 w-20 text-center">ลำดับ</th>
                                    <th className="px-4 py-3">ชื่อรายการเอกสาร</th>
                                    <th className="px-4 py-3 w-32 text-center">ผลต่อคลัง</th>
                                    <th className="px-4 py-3 w-24 text-center">สถานะ</th>
                                    <th className="px-4 py-3 w-28 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <Loader2 size={24} className="animate-spin mx-auto text-indigo-500 mb-2" />
                                            <span className="text-gray-400 italic">กำลังโหลดรายการ...</span>
                                        </td>
                                    </tr>
                                ) : items.length === 0 && !isAdding ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400 italic bg-gray-50/20">
                                            ยังไม่มีรายการย่อย
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Row for Adding New Item */}
                                        {isAdding && (
                                            <tr className="bg-emerald-50/30 dark:bg-emerald-900/10 animate-in slide-in-from-top-1 duration-200">
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number"
                                                        value={editData?.docu_item_no || ''}
                                                        onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, docu_item_no: parseInt(e.target.value) }))}
                                                        className="w-full h-8 px-2 text-center bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/50 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        autoFocus
                                                        type="text"
                                                        placeholder="ชื่อรายการ เช่น ขอเบิกใช้"
                                                        value={editData?.docu_item_name || ''}
                                                        onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, docu_item_name: e.target.value }))}
                                                        className="w-full h-8 px-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/50 rounded-md outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select 
                                                        value={editData?.stock_effect_ic ?? ''}
                                                        onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, stock_effect_ic: parseInt(e.target.value) as DocLinkICItem['stock_effect_ic'] }))}
                                                        className="w-full h-8 text-xs bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/50 rounded-md"
                                                    >
                                                        <option value={1}>เพิ่มคลัง</option>
                                                        <option value={-1}>ลดคลัง</option>
                                                        <option value={0}>ไม่กระทบ</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3"></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={handleSave}
                                                            className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setIsAdding(false); setEditData(null); }}
                                                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {/* Existing Items */}
                                        {items.map((item: DocLinkICItem) => (
                                            <tr key={item.docu_item_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                {editingId === item.docu_item_id ? (
                                                    // Row for Editing
                                                    <>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number"
                                                                value={editData?.docu_item_no || ''}
                                                                onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, docu_item_no: parseInt(e.target.value) }))}
                                                                className="w-full h-8 px-2 text-center bg-white dark:bg-gray-800 border border-indigo-200 rounded-md outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={editData?.docu_item_name || ''}
                                                                onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, docu_item_name: e.target.value }))}
                                                                className="w-full h-8 px-2 bg-white dark:bg-gray-800 border border-indigo-200 rounded-md outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select 
                                                                value={editData?.stock_effect_ic ?? ''}
                                                                onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, stock_effect_ic: parseInt(e.target.value) as DocLinkICItem['stock_effect_ic'] }))}
                                                                className="w-full h-8 text-xs bg-white dark:bg-gray-800 border border-indigo-200 rounded-md"
                                                            >
                                                                <option value={1}>เพิ่มคลัง</option>
                                                                <option value={-1}>ลดคลัง</option>
                                                                <option value={0}>ไม่กระทบ</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="checkbox"
                                                                checked={editData?.is_active}
                                                                onChange={e => setEditData((prev: Partial<DocLinkICItem> | null) => ({ ...prev, is_active: e.target.checked }))}
                                                                className="w-4 h-4 text-indigo-600 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button 
                                                                    onClick={handleSave}
                                                                    className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => { setEditingId(null); setEditData(null); }}
                                                                    className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    // Display Row
                                                    <>
                                                        <td className="px-4 py-3 text-center font-mono text-gray-500">
                                                            {item.docu_item_no}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                                                            {item.docu_item_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                                                item.stock_effect_ic === 1 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                item.stock_effect_ic === -1 ? 'bg-red-50 text-red-600 border-red-100' :
                                                                'bg-gray-50 text-gray-500 border-gray-100'
                                                            }`}>
                                                                {item.stock_effect_ic === 1 ? 'เพิ่ม' : item.stock_effect_ic === -1 ? 'ลด' : 'ไม่กระทบ'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className={`w-2 h-2 rounded-full mx-auto ${item.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button 
                                                                    onClick={() => handleStartEdit(item)}
                                                                    disabled={isAdding || editingId !== null}
                                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all disabled:opacity-30"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(item.docu_item_id)}
                                                                    disabled={isAdding || editingId !== null}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all disabled:opacity-30"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Tips */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 flex items-center gap-2">
                    <AlertCircle size={14} className="text-gray-400" />
                    <p className="text-[10px] text-gray-400 italic uppercase tracking-wider">
                        ระบบจะใช้ลำดับที่ 1 เป็นค่าเริ่มต้นในการทำรายการอัตโนมัติ
                    </p>
                </div>
            </div>
        </div>
    );
}
