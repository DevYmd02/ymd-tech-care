import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { PlusCircle, Edit2, Trash2, Save, X, Loader2, ListTree } from 'lucide-react';
import { DocLinkICService } from '../services/doc-link-ic.service';
import type { DocLinkIC, DocLinkICCreatePayload, DocLinkICUpdatePayload } from '../types/doc-link-ic.types';
import { STOCK_EFFECT_OPTIONS, IS_ACTIVE_OPTIONS } from '../types/doc-link-ic.types';
import { DocLinkICItemModal } from './DocLinkICItemModal';

type EditableRow = Partial<DocLinkIC> & { isNew?: boolean };

export function DocLinkICTab() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditableRow | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newRowData, setNewRowData] = useState<EditableRow | null>(null);
    
    // Sub-items Modal State
    const [selectedType, setSelectedType] = useState<DocLinkIC | null>(null);

    // Inline validation errors state
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Refs for UX
    const codeInputRef = useRef<HTMLInputElement>(null);
    const lastRowRef = useRef<HTMLTableRowElement>(null);

    const { data: list = [], isLoading } = useQuery({
        queryKey: ['doc-link-ic'],
        queryFn: () => DocLinkICService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: DocLinkICCreatePayload) => DocLinkICService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('เพิ่มประเภทเอกสารสำเร็จ', 'success');
            setIsAdding(false);
            setNewRowData(null);
            setFieldErrors({});
        },
        onError: () => toast('เกิดข้อผิดพลาดในการเพิ่มเอกสาร', 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: DocLinkICUpdatePayload }) => DocLinkICService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('แก้ไขประเภทเอกสารสำเร็จ', 'success');
            setEditingId(null);
            setEditData(null);
            setFieldErrors({});
        },
        onError: () => toast('เกิดข้อผิดพลาดในการแก้ไขเอกสาร', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => DocLinkICService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('ลบประเภทเอกสารสำเร็จ', 'success');
        },
        onError: () => toast('เกิดข้อผิดพลาดในการลบเอกสาร', 'error'),
    });

    // Auto-focus and Scroll into view when adding new row
    useEffect(() => {
        if (isAdding && lastRowRef.current) {
            lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => codeInputRef.current?.focus(), 300);
        }
    }, [isAdding]);

    const handleAddClick = () => {
        setIsAdding(true);
        setNewRowData({
            isNew: true,
            docu_type_code: '',
            docu_name_th: '',
            docu_name_en: '',
            docu_desc: '',
            remark: '',
            stock_effect_ic: 0,
            is_active: true,
        });
        setEditingId(null);
        setEditData(null);
        setFieldErrors({});
    };

    const handleEditClick = (item: DocLinkIC) => {
        setEditingId(item.docu_type_id);
        setEditData({ ...item });
        setIsAdding(false);
        setNewRowData(null);
        setFieldErrors({});
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditData(null);
        setIsAdding(false);
        setNewRowData(null);
        setFieldErrors({});
    };

    const validateField = (field: string, value: string | number | boolean | null | undefined, data: EditableRow): string => {
        if (field === 'docu_type_code') {
            const valStr = String(value ?? '');
            if (!valStr) return 'กรุณาระบุรหัส';
            if (!/^\d+$/.test(valStr)) return 'ต้องเป็นตัวเลขเท่านั้น';
            const isDup = list.some(item => item.docu_type_code === valStr && item.docu_type_id !== data.docu_type_id);
            if (isDup) return 'รหัสซ้ำกับที่มีอยู่';
        }
        return '';
    };

    const handleBlur = (field: string, value: string | number | boolean | null | undefined, data: EditableRow) => {
        const error = validateField(field, value, data);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateAll = (data: EditableRow) => {
        const errors: Record<string, string> = {};
        errors.docu_type_code = validateField('docu_type_code', data.docu_type_code, data);

        const filteredErrors = Object.fromEntries(Object.entries(errors).filter(([, v]) => !!v));
        setFieldErrors(filteredErrors);
        
        if (Object.keys(filteredErrors).length > 0) {
            toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
            return false;
        }
        return true;
    };

    const handleSaveEdit = () => {
        if (!editData || !editingId) return;
        if (!validateAll(editData)) return;

        updateMutation.mutate({
            id: editingId,
            data: {
                docu_type_code: editData.docu_type_code!,
                docu_name_th: editData.docu_name_th || null,
                docu_name_en: editData.docu_name_en!,
                docu_desc: editData.docu_desc!,
                remark: editData.remark || '',
                stock_effect_ic: editData.stock_effect_ic as DocLinkIC['stock_effect_ic'],
                is_active: editData.is_active || false,
            }
        });
    };

    const handleSaveNew = () => {
        if (!newRowData) return;
        if (!validateAll(newRowData)) return;

        createMutation.mutate({
            docu_type_code: newRowData.docu_type_code!,
            docu_name_th: newRowData.docu_name_th || null,
            docu_name_en: newRowData.docu_name_en!,
            docu_desc: newRowData.docu_desc!,
            remark: newRowData.remark || '',
            stock_effect_ic: newRowData.stock_effect_ic as DocLinkIC['stock_effect_ic'],
            is_active: newRowData.is_active || false,
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่? (หากลบแล้วรายการย่อยทั้งหมดจะถูกลบด้วย)')) {
            deleteMutation.mutate(id);
        }
    };

    const renderStockEffectBadge = (effect: number | null) => {
        switch (effect) {
            case 1:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">เพิ่มคลัง</span>;
            case -1:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">ลดคลัง</span>;
            case 0:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">ไม่กระทบ</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">-</span>;
        }
    };

    const renderEditableRow = (item: EditableRow, isNew: boolean = false) => {
        const handleChange = (field: keyof EditableRow, value: string | number | boolean | null) => {
            if (isNew) {
                setNewRowData(prev => ({ ...prev, [field]: value }));
            } else {
                setEditData(prev => ({ ...prev, [field]: value }));
            }
        };

        const currentData = isNew ? newRowData : editData;
        const isSaving = isNew ? createMutation.isPending : updateMutation.isPending;

        const inputClass = (field: string) => `w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-gray-800 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 ${
            fieldErrors[field] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
        }`;

        return (
            <tr key={isNew ? 'new-row' : item.docu_type_id} ref={isNew ? lastRowRef : null} className="bg-amber-50/40 dark:bg-amber-900/10">
                <td className="sticky left-0 z-10 px-3 py-3 bg-amber-50 dark:bg-[#1a1c23] shadow-[2px_0_5px_rgba(0,0,0,0.3)] w-[140px]">
                    <input
                        ref={isNew ? codeInputRef : null}
                        type="text"
                        value={currentData?.docu_type_code || ''}
                        onChange={(e) => handleChange('docu_type_code', e.target.value)}
                        onBlur={(e) => handleBlur('docu_type_code', e.target.value, currentData!)}
                        placeholder="รหัส *"
                        className={inputClass('docu_type_code')}
                    />
                    {fieldErrors.docu_type_code && <p className="text-[10px] text-red-500 mt-0.5 font-medium leading-tight">{fieldErrors.docu_type_code}</p>}
                </td>

                <td className="px-3 py-3 w-[250px]">
                    <input
                        type="text"
                        value={currentData?.docu_name_th || ''}
                        onChange={(e) => handleChange('docu_name_th', e.target.value)}
                        placeholder="ชื่อประเภทเอกสาร (TH)"
                        className={inputClass('docu_name_th')}
                    />
                </td>

                <td className="px-3 py-3 w-[250px]">
                    <input
                        type="text"
                        value={currentData?.docu_name_en || ''}
                        onChange={(e) => handleChange('docu_name_en', e.target.value)}
                        placeholder="ชื่อประเภทเอกสาร (EN)"
                        className={inputClass('docu_name_en')}
                    />
                </td>

                <td className="px-3 py-3 w-[180px]">
                     <span className="text-gray-400 italic text-xs">บันทึกก่อนเพิ่มรายการ</span>
                </td>

                <td className="px-3 py-3 w-[300px]">
                    <input
                        type="text"
                        value={currentData?.docu_desc || ''}
                        onChange={(e) => handleChange('docu_desc', e.target.value)}
                        placeholder="คำอธิบาย"
                        className={inputClass('docu_desc')}
                    />
                </td>

                <td className="px-3 py-3 w-[250px]">
                    <input
                        type="text"
                        value={currentData?.remark || ''}
                        onChange={(e) => handleChange('remark', e.target.value)}
                        placeholder="หมายเหตุ"
                        className={inputClass('remark')}
                    />
                </td>

                <td className="px-3 py-3 w-[180px]">
                    <select
                        value={currentData?.stock_effect_ic ?? ''}
                        onChange={(e) => handleChange('stock_effect_ic', e.target.value === '' ? null : Number(e.target.value))}
                        className={inputClass('stock_effect_ic')}
                    >
                        {STOCK_EFFECT_OPTIONS.map(opt => (
                            <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                        ))}
                    </select>
                </td>

                <td className="px-3 py-3 w-[100px]">
                    <select
                        value={currentData?.is_active ? 'true' : 'false'}
                        onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                        className={inputClass('is_active')}
                    >
                        {IS_ACTIVE_OPTIONS.map(opt => (
                            <option key={opt.label} value={String(opt.value)}>{opt.label}</option>
                        ))}
                    </select>
                </td>

                <td className="sticky right-0 z-10 px-3 py-3 bg-amber-50 dark:bg-[#1a1c23] shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-center gap-1.5">
                        <button
                            type="button"
                            onClick={isNew ? handleSaveNew : handleSaveEdit}
                            disabled={isSaving}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                            title="บันทึก"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelClick}
                            disabled={isSaving}
                            className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            title="ยกเลิก"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    กำหนดประเภทเอกสารเชื่อม IC
                </h2>
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={isAdding || editingId !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                    <PlusCircle size={18} />
                    เพิ่มประเภทเอกสาร
                </button>
            </div>

            <div className="overflow-x-auto overflow-y-visible rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative max-h-[600px]">
                <table className="min-w-[1500px] text-sm border-separate border-spacing-0 w-full">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <th className="sticky left-0 z-30 px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[140px] bg-gray-50 dark:bg-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                รหัส
                            </th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[250px]">ชื่อประเภทเอกสาร TH</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[250px]">ชื่อประเภทเอกสาร EN</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[180px]">รายการเอกสาร</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[300px]">คำอธิบาย</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[250px]">หมายเหตุ</th>
                            <th className="px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[180px]">ผลต่อคลังเริ่มต้น</th>
                            <th className="px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[100px]">สถานะ</th>
                            <th className="sticky right-0 z-30 px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[120px] bg-gray-50 dark:bg-gray-800 shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">
                                จัดการ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                                        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : list.length === 0 && !isAdding ? (
                            <tr>
                                <td colSpan={9} className="py-20 text-center text-gray-500 italic">
                                    ไม่พบข้อมูลประเภทเอกสารเชื่อม IC
                                </td>
                            </tr>
                        ) : (
                            <>
                                {list.map(item => (
                                    editingId === item.docu_type_id ? (
                                        renderEditableRow(item, false)
                                    ) : (
                                        <tr key={item.docu_type_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                                            <td className="sticky left-0 z-10 px-3 py-3 font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1a1c23] shadow-[2px_0_5px_rgba(0,0,0,0.3)] w-[140px]">
                                                {item.docu_type_code}
                                            </td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[250px]">
                                                {item.docu_name_th || '-'}
                                            </td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[250px]">
                                                {item.docu_name_en}
                                            </td>
                                            <td className="px-3 py-3 text-indigo-600 dark:text-indigo-400 font-medium italic truncate max-w-[180px]">
                                                จัดการในปุ่ม List →
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 truncate max-w-[300px]" title={item.docu_desc}>
                                                {item.docu_desc}
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 truncate max-w-[250px]" title={item.remark}>
                                                {item.remark || '-'}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {renderStockEffectBadge(item.stock_effect_ic)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${item.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                                    {item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                                </span>
                                            </td>
                                            <td className="sticky right-0 z-10 px-3 py-3 bg-white dark:bg-[#1a1c23] shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedType(item)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                                                        title="จัดการรายการย่อย"
                                                    >
                                                        <ListTree size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditClick(item)}
                                                        disabled={isAdding || (editingId !== null && editingId !== item.docu_type_id)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all disabled:opacity-20"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.docu_type_id)}
                                                        disabled={isAdding || editingId !== null}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-20"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ))}
                                {isAdding && newRowData && renderEditableRow(newRowData, true)}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="text-[11px] text-gray-400 italic px-2">
                * ตารางรองรับการเลื่อนในแนวนอน (Horizontal Scroll) และแถวแรก/แถวสุดท้ายจะถูกตรึงไว้คงที่
            </div>

            {/* Sub-items Modal */}
            <DocLinkICItemModal 
                isOpen={!!selectedType}
                onClose={() => setSelectedType(null)}
                parentType={selectedType}
            />
        </div>
    );
}
