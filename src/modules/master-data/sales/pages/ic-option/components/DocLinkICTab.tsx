import type { Dispatch, SetStateAction } from 'react';
import { PlusCircle, Trash2, Save, X, Loader2, PlusCircle as PlusIcon } from 'lucide-react';
import { useDocLinkIC } from '../hooks/useDocLinkIC';
import type { SubItem, EditableRow } from '../hooks/useDocLinkIC';
import { IS_ACTIVE_OPTIONS } from '../types/doc-link-ic.types';

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
    const {
        isLoading,
        systemDocs,
        editingId,
        editData,
        isAdding,
        newRowData,
        fieldErrors,
        isDocFocused,
        setIsDocFocused,
        setEditData,
        setNewRowData,
        parents,
        getSubsFor,
        lastRowRef,
        isSaving,
        handleAddClick,
        handleEditClick,
        handleCancel,
        handleSaveNew,
        handleSaveEdit,
        handleDelete,
    } = useDocLinkIC();

    const inputCls = (err?: string) => `w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500 outline-none ${err ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`;

    const renderSubCell = (subs: SubItem[], isEdit: boolean, setter: Dispatch<SetStateAction<EditableRow | null>>) => (
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

    const renderStockCell = (subs: SubItem[], isEdit: boolean, setter: Dispatch<SetStateAction<EditableRow | null>>) => (
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

    const renderDescCell = (subs: SubItem[], isEdit: boolean, setter: Dispatch<SetStateAction<EditableRow | null>>, parentVal: string) => (
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

    const renderRemarkCell = (subs: SubItem[], isEdit: boolean, setter: Dispatch<SetStateAction<EditableRow | null>>, parentVal: string) => (
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
        return (
            <tr key={isNew ? 'new' : String(item.doc_link_ic_id ?? item.docu_type_id)} ref={isNew ? lastRowRef : null} className="bg-[#fefaf6] dark:bg-[#1f1107]">
                <td className="sticky left-0 z-10 px-3 py-3 bg-[#fefaf6] dark:bg-[#1f1107] shadow-[2px_0_5px_rgba(0,0,0,0.15)] w-[140px] align-top border-b border-gray-200 dark:border-gray-700/60">
                    {isNew ? (
                        <div className="space-y-1">
                            <select 
                                value={currentData?.system_document_id||''} 
                                onFocus={() => setIsDocFocused(true)}
                                onBlur={() => setIsDocFocused(false)}
                                onChange={e => { 
                                    const id = e.target.value ? Number(e.target.value) : null; 
                                    const doc = systemDocs.find(d => d.system_document_id === id); 
                                    setter(p => ({
                                        ...p!,
                                        system_document_id: id,
                                        docu_type_code: doc?.system_document_code || '',
                                        docu_name_th: doc?.system_document_name || '',
                                        docu_name_en: doc?.system_document_name_eng || doc?.system_document_name || ''
                                    })); 
                                    e.target.blur();
                                }} 
                                className={inputCls(fieldErrors.system_document_id)}
                            >
                                <option value="">-- เลือก --</option>
                                {systemDocs.map(d => {
                                    const isUsed = parents.some(p => p.is_active && Number(p.system_document_id) === d.system_document_id);
                                    return (
                                        <option 
                                            key={d.system_document_id} 
                                            value={d.system_document_id}
                                            disabled={isUsed}
                                        >
                                            {isDocFocused 
                                                ? `${d.system_document_code} - ${d.system_document_name}${isUsed ? ' (ถูกใช้งานแล้ว)' : ''}` 
                                                : `${d.system_document_code}${isUsed ? ' (ใช้งานแล้ว)' : ''}`
                                            }
                                        </option>
                                    );
                                })}
                            </select>
                            {fieldErrors.system_document_id && (
                                <p className="text-[10px] text-red-500 leading-tight font-medium">{fieldErrors.system_document_id}</p>
                            )}
                        </div>
                    ) : <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentData?.docu_type_code}</span>}
                </td>
                <td className="px-3 py-3 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60"><input type="text" value={currentData?.docu_name_th||''} readOnly className={inputCls()+' cursor-not-allowed opacity-60'} placeholder="ชื่อ TH (อัตโนมัติ)"/></td>
                <td className="px-3 py-3 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60"><input type="text" value={currentData?.docu_name_en||''} readOnly className={inputCls()+' cursor-not-allowed opacity-60'} placeholder="ชื่อ EN (อัตโนมัติ)"/></td>
                <td className="px-3 py-3 w-[280px] align-top border-b border-gray-200 dark:border-gray-700/60">{setter && renderSubCell(subs, true, setter)}</td>
                <td className="px-3 py-3 w-[180px] align-top border-b border-gray-200 dark:border-gray-700/60">{setter && renderStockCell(subs, true, setter)}</td>
                <td className="px-3 py-3 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60">{setter && renderDescCell(subs, true, setter, currentData?.docu_desc || '')}</td>
                <td className="px-3 py-3 w-[180px] align-top border-b border-gray-200 dark:border-gray-700/60">{setter && renderRemarkCell(subs, true, setter, currentData?.remark || '')}</td>
                <td className="px-3 py-3 w-[130px] align-top border-b border-gray-200 dark:border-gray-700/60">
                    <select value={currentData?.is_active?'true':'false'} onChange={e=>setter(p=>({...p!,is_active:e.target.value==='true'}))} className={inputCls()}>
                        {IS_ACTIVE_OPTIONS.map(o=><option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                    </select>
                </td>
                <td className="sticky right-0 z-10 px-3 py-3 bg-[#fefaf6] dark:bg-[#1f1107] shadow-[-2px_0_5px_rgba(0,0,0,0.15)] align-top border-b border-gray-200 dark:border-gray-700/60">
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
                            <th className="px-3 py-3 text-center font-bold text-gray-600 dark:text-gray-300 w-[130px] border-b-2 border-gray-300 dark:border-gray-600">สถานะ</th>
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
                                            <td className="sticky left-0 z-10 px-3 py-3 font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 shadow-[2px_0_5px_rgba(0,0,0,0.08)] w-[140px] align-top border-b border-gray-200 dark:border-gray-700/60">{displayCode}</td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60">{displayNameTH}</td>
                                            <td className="px-3 py-3 text-gray-700 dark:text-gray-300 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60">{displayNameEN}</td>
                                            <td className="px-3 py-3 w-[280px] align-top border-b border-gray-200 dark:border-gray-700/60">
                                                <div className="flex flex-col gap-1">
                                                    {subs.length>0
                                                        ? subs.map((s,i)=><span key={i} className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${STOCK_TAG_COLOR[s.stock_effect_ic??0]}`}>{i+1}. {s.doc_type_name||s.docu_item_name}</span>)
                                                        : <span className="text-sm text-gray-400 italic">ไม่มีรายการย่อย</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 w-[180px] align-top border-b border-gray-200 dark:border-gray-700/60">
                                                <div className="flex flex-col gap-1">
                                                    {subs.length > 0
                                                        ? subs.map((s,i) => <span key={i} className={STOCK_BADGE_CLS[s.stock_effect_ic??0]}>{STOCK_LABEL[s.stock_effect_ic??0]}</span>)
                                                        : <span className={STOCK_BADGE_CLS[item.stock_effect_ic??0]}>{STOCK_LABEL[item.stock_effect_ic??0]}</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 w-[220px] align-top border-b border-gray-200 dark:border-gray-700/60">
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
                                            <td className="px-3 py-3 w-[180px] align-top border-b border-gray-200 dark:border-gray-700/60">
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
                                            <td className="px-3 py-3 text-center align-top border-b border-gray-200 dark:border-gray-700/60 w-[130px]">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>{item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>
                                            </td>
                                            <td className="sticky right-0 z-10 px-3 py-3 bg-white dark:bg-gray-900 shadow-[-2px_0_5px_rgba(0,0,0,0.08)] align-top border-b border-gray-200 dark:border-gray-700/60">
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
