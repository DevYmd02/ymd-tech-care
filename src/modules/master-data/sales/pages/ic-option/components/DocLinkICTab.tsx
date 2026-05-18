import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { PlusCircle, Trash2, Save, X, Loader2, PlusCircle as PlusIcon } from 'lucide-react';
import { DocLinkICService } from '../services/doc-link-ic.service';
import { SystemDocumentService } from '../services/system-document.service';
import type { DocLinkIC, DocLinkICCreatePayload, DocLinkICUpdatePayload } from '../types/doc-link-ic.types';
import { IS_ACTIVE_OPTIONS } from '../types/doc-link-ic.types';
import type { SystemDocument } from '../services/system-document.service';

type SubItem = { docu_item_id?: string; name: string; stock_effect_ic: 0 | 1 | 2; docu_desc?: string; remark?: string; };
type EditableRow = Partial<DocLinkIC> & { isNew?: boolean; initial_sub_items?: SubItem[]; system_document_id?: number | null; };

const STOCK_TAG_COLOR: Record<number, string> = {
    0: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    1: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    2: 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};
const STOCK_LABEL: Record<number, string> = { 0: 'ไม่กระทบ', 1: 'เพิ่มคลัง', 2: 'ลดคลัง' };
const STOCK_BADGE_CLS: Record<number, string> = {
    0: 'px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    1: 'px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    2: 'px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
};

export function DocLinkICTab() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const lastRowRef = useRef<HTMLTableRowElement>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditableRow | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newRowData, setNewRowData] = useState<EditableRow | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { data: rawList = [], isLoading } = useQuery({
        queryKey: ['doc-link-ic'],
        queryFn: () => DocLinkICService.getAll(),
    });

    const { data: systemDocs = [] } = useQuery<SystemDocument[]>({
        queryKey: ['system-documents'],
        queryFn: () => SystemDocumentService.getAll(),
    });

    // Group flat list into parent rows with sub-items
    const parents = rawList.filter(r => !r.doc_type_name || r.doc_type_no === 0 || r.doc_type_no === null);
    const subItems = rawList.filter(r => r.doc_type_name && r.doc_type_no && r.doc_type_no > 0);

    const getSubsFor = (item: DocLinkIC) =>
        subItems.filter(s => Number(s.system_document_id) === Number(item.system_document_id));

    const createMutation = useMutation({
        mutationFn: (data: DocLinkICCreatePayload) => DocLinkICService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('เพิ่มประเภทเอกสารสำเร็จ', 'success');
            setIsAdding(false); setNewRowData(null); setFieldErrors({});
        },
        onError: () => toast('เกิดข้อผิดพลาด', 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: DocLinkICUpdatePayload }) => DocLinkICService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('แก้ไขสำเร็จ', 'success');
            setEditingId(null); setEditData(null); setFieldErrors({});
        },
        onError: () => toast('เกิดข้อผิดพลาด', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => DocLinkICService.remove(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] }); toast('ลบสำเร็จ', 'success'); },
        onError: () => toast('เกิดข้อผิดพลาด', 'error'),
    });

    useEffect(() => {
        if (isAdding && lastRowRef.current) lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [isAdding]);

    const handleAddClick = () => {
        setIsAdding(true);
        setNewRowData({ isNew: true, system_document_id: null, docu_type_code: '', docu_name_th: '', docu_name_en: '', docu_desc: '', remark: '', stock_effect_ic: 0, is_active: true, initial_sub_items: [{ name: '', stock_effect_ic: 0 }] });
        setEditingId(null); setEditData(null); setFieldErrors({});
    };

    const handleEditClick = (item: DocLinkIC) => {
        const rowKey = String(item.doc_link_ic_id ?? item.docu_type_id);
        const sysdoc = systemDocs.find(d => d.system_document_id === Number(item.system_document_id));
        const subs = getSubsFor(item).map(s => ({ docu_item_id: String(s.doc_link_ic_id ?? ''), name: s.doc_type_name || '', stock_effect_ic: (s.stock_effect_ic ?? 0) as 0|1|2, docu_desc: s.docu_desc || '', remark: s.remark || '' }));
        setEditingId(rowKey);
        setEditData({
            ...item,
            docu_type_code: item.docu_type_code || sysdoc?.system_document_code || '',
            docu_name_th: item.docu_name_th || sysdoc?.system_document_name || '',
            docu_name_en: item.docu_name_en || sysdoc?.system_document_name_eng || sysdoc?.system_document_name || '',
            initial_sub_items: subs.length ? subs : [{ name: '', stock_effect_ic: 0 }],
        });
        setIsAdding(false); setNewRowData(null); setFieldErrors({});
    };

    const handleCancel = () => { setEditingId(null); setEditData(null); setIsAdding(false); setNewRowData(null); setFieldErrors({}); };

    const handleSaveNew = async () => {
        if (!newRowData?.system_document_id) { toast('กรุณาเลือกประเภทเอกสาร', 'error'); return; }
        const subs = (newRowData.initial_sub_items || []).filter(s => s.name.trim());
        createMutation.mutate({
            system_document_id: Number(newRowData.system_document_id),
            docu_desc: newRowData.docu_desc || '',
            remark: newRowData.remark || '',
            stock_effect_ic: (newRowData.stock_effect_ic ?? 0) as 0|1|2,
            is_active: newRowData.is_active ?? true,
        });
        for (const sub of subs) {
            await DocLinkICService.createItem({ docu_type_id: String(newRowData.system_document_id), docu_item_no: 1, docu_item_name: sub.name, stock_effect_ic: sub.stock_effect_ic, is_active: true, system_document_id: Number(newRowData.system_document_id), doc_type_name: sub.name, docu_desc: sub.docu_desc, remark: sub.remark } as any);
        }
    };

    const handleSaveEdit = async () => {
        if (!editData || !editingId) return;
        const subs = (editData.initial_sub_items || []).filter(s => s.name.trim());
        updateMutation.mutate({ id: editingId, data: { docu_desc: editData.docu_desc || '', remark: editData.remark || '', stock_effect_ic: (editData.stock_effect_ic ?? 0) as 0|1|2, is_active: editData.is_active ?? false } });
        const origSubs = getSubsFor(rawList.find(r => String(r.doc_link_ic_id ?? r.docu_type_id) === editingId)!);
        const newIds = new Set(subs.filter(s => s.docu_item_id).map(s => s.docu_item_id!));
        for (const orig of origSubs) { if (!newIds.has(String(orig.doc_link_ic_id))) await DocLinkICService.removeItem(String(orig.doc_link_ic_id)); }
        for (const sub of subs) {
            if (sub.docu_item_id) await DocLinkICService.updateItem(sub.docu_item_id, { doc_type_name: sub.name, docu_item_name: sub.name, stock_effect_ic: sub.stock_effect_ic, docu_desc: sub.docu_desc, remark: sub.remark } as any);
            else await DocLinkICService.createItem({ docu_type_id: String(editData.system_document_id), docu_item_no: 1, docu_item_name: sub.name, stock_effect_ic: sub.stock_effect_ic, is_active: true, system_document_id: Number(editData.system_document_id), doc_type_name: sub.name, docu_desc: sub.docu_desc, remark: sub.remark } as any);
        }
        queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
    };

    const handleDelete = (id: string) => { if (window.confirm('ลบรายการนี้?')) deleteMutation.mutate(id); };

    const inputCls = (err?: string) => `w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500 outline-none ${err ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`;

    const renderSubCell = (subs: SubItem[], isEdit: boolean, setter: (fn: (p: EditableRow | null) => EditableRow | null) => void) => (
        <div className="flex flex-col gap-1.5">
            {subs.map((sub, idx) => isEdit ? (
                <div key={idx} className="flex gap-1.5 items-center">
                    <span className="text-xs text-gray-500 w-4 shrink-0">{idx+1}</span>
                    <input type="text" value={sub.name} onChange={e => { const v = e.target.value; setter(p => { if (!p) return p; const items = [...(p.initial_sub_items||[])]; items[idx]={...items[idx],name:v}; return {...p,initial_sub_items:items}; }); }} className={inputCls()} placeholder="ชื่อรายการย่อย..." />
                    <button type="button" onClick={() => setter(p => { if (!p) return p; return {...p,initial_sub_items:(p.initial_sub_items||[]).filter((_,i)=>i!==idx)}; })} className="p-1.5 text-gray-500 hover:text-red-400 rounded"><Trash2 size={14}/></button>
                </div>
            ) : (
                <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_TAG_COLOR[sub.stock_effect_ic ?? 0]}`}>{sub.name}</span>
            ))}
            {isEdit && <button type="button" onClick={() => setter(p => ({...p!, initial_sub_items: [...(p?.initial_sub_items||[]), {name:'',stock_effect_ic:0}]}))} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-0.5"><PlusIcon size={12}/>เพิ่มแถวรายการย่อย</button>}
            {!isEdit && subs.length === 0 && <span className="text-sm text-gray-400 italic">ไม่มีรายการย่อย</span>}
        </div>
    );

    const renderStockCell = (subs: SubItem[], isEdit: boolean, setter: (fn: (p: EditableRow | null) => EditableRow | null) => void) => (
        <div className="flex flex-col gap-1.5">
            {subs.length === 0
                ? <span className={STOCK_BADGE_CLS[0]}>{STOCK_LABEL[0]}</span>
                : subs.map((sub, idx) => isEdit ? (
                <select key={idx} value={sub.stock_effect_ic} onChange={e => { const v = Number(e.target.value) as 0|1|2; setter(p => { if (!p) return p; const items=[...(p.initial_sub_items||[])]; items[idx]={...items[idx],stock_effect_ic:v}; return {...p,initial_sub_items:items}; }); }} className={inputCls()}>
                    <option value={0}>ไม่กระทบ</option>
                    <option value={1}>เพิ่มคลัง</option>
                    <option value={2}>ลดคลัง</option>
                </select>
            ) : (
                <span key={idx} className={STOCK_BADGE_CLS[sub.stock_effect_ic ?? 0]}>{STOCK_LABEL[sub.stock_effect_ic ?? 0]}</span>
            ))}
        </div>
    );

    const renderDescCell = (subs: SubItem[], isEdit: boolean, setter: (fn: (p: EditableRow | null) => EditableRow | null) => void, parentVal: string) => (
        <div className="flex flex-col gap-1.5">
            {subs.length === 0 ? (
                isEdit
                    ? <input type="text" value={parentVal} onChange={e => setter(p => ({...p!, docu_desc: e.target.value}))} placeholder="คำอธิบาย" className={inputCls()}/>
                    : <span className="text-xs text-gray-400">{parentVal || '-'}</span>
            ) : subs.map((sub, idx) => isEdit ? (
                <input key={idx} type="text" value={sub.docu_desc || ''} onChange={e => { const v = e.target.value; setter(p => { if (!p) return p; const items = [...(p.initial_sub_items||[])]; items[idx]={...items[idx], docu_desc: v}; return {...p, initial_sub_items: items}; }); }} placeholder="คำอธิบาย" className={inputCls()}/>
            ) : (
                <span key={idx} className="text-xs text-gray-400">{sub.docu_desc || '-'}</span>
            ))}
        </div>
    );

    const renderRemarkCell = (subs: SubItem[], isEdit: boolean, setter: (fn: (p: EditableRow | null) => EditableRow | null) => void, parentVal: string) => (
        <div className="flex flex-col gap-1.5">
            {subs.length === 0 ? (
                isEdit
                    ? <input type="text" value={parentVal} onChange={e => setter(p => ({...p!, remark: e.target.value}))} placeholder="หมายเหตุ" className={inputCls()}/>
                    : <span className="text-xs text-gray-400">{parentVal || '-'}</span>
            ) : subs.map((sub, idx) => isEdit ? (
                <input key={idx} type="text" value={sub.remark || ''} onChange={e => { const v = e.target.value; setter(p => { if (!p) return p; const items = [...(p.initial_sub_items||[])]; items[idx]={...items[idx], remark: v}; return {...p, initial_sub_items: items}; }); }} placeholder="หมายเหตุ" className={inputCls()}/>
            ) : (
                <span key={idx} className="text-xs text-gray-400">{sub.remark || '-'}</span>
            ))}
        </div>
    );

    const renderRow = (item: EditableRow, isNew: boolean) => {
        const currentData = isNew ? newRowData : editData;
        const subs = currentData?.initial_sub_items || [];
        const setter = isNew ? setNewRowData : setEditData;
        const isSaving = isNew ? createMutation.isPending : updateMutation.isPending;
        return (
            <tr key={isNew ? 'new' : String(item.doc_link_ic_id ?? item.docu_type_id)} ref={isNew ? lastRowRef : null} className="bg-amber-50 dark:bg-amber-950/20">
                <td className="sticky left-0 z-10 px-3 py-3 bg-amber-50 dark:bg-amber-950/40 shadow-[2px_0_5px_rgba(0,0,0,0.15)] w-[140px] align-top">
                    {isNew ? (
                        <select value={currentData?.system_document_id||''} onChange={e => { const id = e.target.value?Number(e.target.value):null; const doc = systemDocs.find(d=>d.system_document_id===id); setter(p=>({...p!,system_document_id:id,docu_type_code:doc?.system_document_code||'',docu_name_th:doc?.system_document_name||'',docu_name_en:doc?.system_document_name_eng||doc?.system_document_name||''})); }} className={inputCls(fieldErrors.system_document_id)}>
                            <option value="">-- เลือก --</option>
                            {systemDocs.map(d=><option key={d.system_document_id} value={d.system_document_id}>{d.system_document_code} - {d.system_document_name}</option>)}
                        </select>
                    ) : <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentData?.docu_type_code}</span>}
                </td>
                <td className="px-3 py-3 w-[220px] align-top"><input type="text" value={currentData?.docu_name_th||''} readOnly className={inputCls()+' cursor-not-allowed opacity-60'} placeholder="ชื่อ TH (อัตโนมัติ)"/></td>
                <td className="px-3 py-3 w-[220px] align-top"><input type="text" value={currentData?.docu_name_en||''} readOnly className={inputCls()+' cursor-not-allowed opacity-60'} placeholder="ชื่อ EN (อัตโนมัติ)"/></td>
                <td className="px-3 py-3 w-[280px] align-top">{renderSubCell(subs, true, setter as any)}</td>
                <td className="px-3 py-3 w-[180px] align-top">{renderStockCell(subs, true, setter as any)}</td>
                <td className="px-3 py-3 w-[220px] align-top">{renderDescCell(subs, true, setter as any, currentData?.docu_desc || '')}</td>
                <td className="px-3 py-3 w-[180px] align-top">{renderRemarkCell(subs, true, setter as any, currentData?.remark || '')}</td>
                <td className="px-3 py-3 w-[100px] align-top">
                    <select value={currentData?.is_active?'true':'false'} onChange={e=>setter(p=>({...p!,is_active:e.target.value==='true'}))} className={inputCls()}>
                        {IS_ACTIVE_OPTIONS.map(o=><option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                    </select>
                </td>
                <td className="sticky right-0 z-10 px-3 py-3 bg-amber-50 dark:bg-amber-950/40 shadow-[-2px_0_5px_rgba(0,0,0,0.15)] align-top">
                    <div className="flex flex-col gap-1.5">
                        <button type="button" onClick={isNew?handleSaveNew:handleSaveEdit} disabled={isSaving} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center">
                            {isSaving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}
                        </button>
                        <button type="button" onClick={handleCancel} disabled={isSaving} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center"><X size={16}/></button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">กำหนดประเภทเอกสารเชื่อม IC</h2>
                <button type="button" onClick={handleAddClick} disabled={isAdding||editingId!==null} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95">
                    <PlusCircle size={18}/>เพิ่มประเภทเอกสาร
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative max-h-[600px]">
                <table className="min-w-[1400px] text-sm border-separate border-spacing-0 w-full">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="sticky left-0 z-30 px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[140px] bg-gray-100 dark:bg-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.08)] border-b-2 border-gray-300 dark:border-gray-600">รหัส</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[220px] border-b-2 border-gray-300 dark:border-gray-600">ชื่อ TH</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[220px] border-b-2 border-gray-300 dark:border-gray-600">ชื่อ EN</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[280px] border-b-2 border-gray-300 dark:border-gray-600">รายการเอกสาร</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[180px] border-b-2 border-gray-300 dark:border-gray-600">ผลต่อคลัง</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[220px] border-b-2 border-gray-300 dark:border-gray-600">คำอธิบาย</th>
                            <th className="px-3 py-3 text-left font-bold text-gray-600 dark:text-gray-300 w-[180px] border-b-2 border-gray-300 dark:border-gray-600">หมายเหตุ</th>
                            <th className="px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[100px] border-b-2 border-gray-300 dark:border-gray-600">สถานะ</th>
                            <th className="sticky right-0 z-30 px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[100px] bg-gray-100 dark:bg-gray-800 shadow-[-2px_0_5px_rgba(0,0,0,0.08)] border-b-2 border-gray-300 dark:border-gray-600">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900/50">
                        {isLoading ? (
                            <tr><td colSpan={9} className="py-20 text-center"><Loader2 size={32} className="animate-spin text-indigo-500 mx-auto"/></td></tr>
                        ) : parents.length===0 && !isAdding ? (
                            <tr><td colSpan={9} className="py-20 text-center text-gray-500 italic">ไม่พบข้อมูล</td></tr>
                        ) : (
                            <>
                                {parents.map(item => {
                                    const rowKey = String(item.doc_link_ic_id ?? item.docu_type_id);
                                    if (editingId === rowKey) return renderRow(item, false);
                                    const subs = getSubsFor(item);
                                    const sysdoc = systemDocs.find(d => d.system_document_id === Number(item.system_document_id));
                                    const displayCode = item.docu_type_code || sysdoc?.system_document_code || String(item.system_document_id ?? '-');
                                    const displayNameTH = item.docu_name_th || sysdoc?.system_document_name || '-';
                                    const displayNameEN = item.docu_name_en || sysdoc?.system_document_name_eng || sysdoc?.system_document_name || '-';
                                    return (
                                        <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                            <td className="sticky left-0 z-10 px-3 py-3 font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 shadow-[2px_0_5px_rgba(0,0,0,0.08)] w-[140px] align-top">{displayCode}</td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 w-[220px] align-top">{displayNameTH}</td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 w-[220px] align-top">{displayNameEN}</td>
                                            <td className="px-3 py-3 w-[280px] align-top">
                                                <div className="flex flex-col gap-1">
                                                    {subs.length>0
                                                        ? subs.map((s,i)=><span key={i} className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${STOCK_TAG_COLOR[s.stock_effect_ic??0]}`}>{s.doc_type_name||s.docu_type_code}</span>)
                                                        : <span className="text-sm text-gray-400 italic">ไม่มีรายการย่อย</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 w-[180px] align-top">
                                                <div className="flex flex-col gap-1">
                                                    {subs.length > 0
                                                        ? subs.map((s,i) => <span key={i} className={STOCK_BADGE_CLS[s.stock_effect_ic??0]}>{STOCK_LABEL[s.stock_effect_ic??0]}</span>)
                                                        : <span className={STOCK_BADGE_CLS[item.stock_effect_ic??0]}>{STOCK_LABEL[item.stock_effect_ic??0]}</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 w-[220px] align-top">
                                                {subs.length > 0
                                                    ? <div className="flex flex-col gap-1">
                                                        {subs.map((s, i) => (
                                                            <span key={i} className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[210px]" title={s.docu_desc || s.doc_type_name || ''}>
                                                                {s.docu_desc || s.doc_type_name || '-'}
                                                            </span>
                                                        ))}
                                                      </div>
                                                    : <span className="text-sm text-gray-600 dark:text-gray-300 truncate" title={item.docu_desc}>{item.docu_desc || sysdoc?.system_document_name || '-'}</span>
                                                }
                                            </td>
                                            <td className="px-3 py-3 w-[180px] align-top">
                                                {subs.length > 0
                                                    ? <div className="flex flex-col gap-1">
                                                        {subs.map((s, i) => (
                                                            <span key={i} className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[170px]" title={s.remark || s.doc_type_name || ''}>
                                                                {s.remark || s.doc_type_name || '-'}
                                                            </span>
                                                        ))}
                                                      </div>
                                                    : <span className="text-sm text-gray-600 dark:text-gray-300 truncate" title={item.remark}>{item.remark || '-'}</span>
                                                }
                                            </td>
                                            <td className="px-3 py-3 text-center align-top">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>{item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>
                                            </td>
                                            <td className="sticky right-0 z-10 px-3 py-3 bg-white dark:bg-gray-900 shadow-[-2px_0_5px_rgba(0,0,0,0.08)] align-top">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button type="button" onClick={()=>handleEditClick(item)} disabled={isAdding||(editingId!==null&&editingId!==item.docu_type_id)} className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-all disabled:opacity-20" title="แก้ไข">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button type="button" onClick={()=>handleDelete(item.docu_type_id)} disabled={isAdding||editingId!==null} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-20" title="ลบ"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {isAdding && newRowData && renderRow(newRowData, true)}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="text-[11px] text-gray-500 italic px-2">* ตารางรองรับการเลื่อนในแนวนอน</div>
        </div>
    );
}
