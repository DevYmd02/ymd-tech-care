import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { Save, ChevronDown, Loader2 } from 'lucide-react';
import { ICOptionListService } from '../services/ic-option-list.service';
import { SystemDocumentService } from '../services/system-document.service';
import type { ICOptionListItem } from '../types/ic-option-list.types';
import {
    NEGATIVE_STOCK_CHECK_OPTIONS,
    NEGATIVE_STOCK_MODE_OPTIONS,
    QUANTITY_VALIDATION_OPTIONS,
} from '../types/ic-option-list.types';

interface Props {
    icOptionId: string;
}

// ==========================================
// OPTION DROPDOWN CELL
// ==========================================
interface OptionSelectCellProps {
    value: number;
    options: ReadonlyArray<{ id: number; name: string }>;
    onChange: (val: number) => void;
    isSaving?: boolean;
}

function OptionSelectCell({ value, options, onChange, isSaving }: OptionSelectCellProps) {
    return (
        <div className="relative">
            <select
                value={value}
                disabled={isSaving}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none pr-7"
            >
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
    );
}

// ==========================================
// GRID TAB
// ==========================================
interface GridTabProps {
    documents: Array<{ system_document_id: number; system_document_code: string; system_document_name: string }>;
    itemMap: Map<number, ICOptionListItem>;
    icOptionId: number;
    onSaved: () => void;
}

function GridTab({ documents, itemMap, icOptionId, onSaved }: GridTabProps) {
    const { toast } = useToast();
    const [drafts, setDrafts] = useState<Map<number, Partial<ICOptionListItem>>>(new Map());
    const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

    const setDraft = (docId: number, field: keyof ICOptionListItem, value: number) => {
        setDrafts((prev) => {
            const next = new Map(prev);
            next.set(docId, { ...(next.get(docId) ?? {}), [field]: value });
            return next;
        });
    };

    const getValue = (docId: number, field: keyof ICOptionListItem): number => {
        const draft = drafts.get(docId);
        if (draft && field in draft) return draft[field] as number;
        return (itemMap.get(docId)?.[field] as number) ?? 0;
    };

    const isDirtyRow = (docId: number) => {
        const draft = drafts.get(docId);
        if (!draft) return false;
        const orig = itemMap.get(docId);
        return (
            (draft.negative_stock_check !== undefined && draft.negative_stock_check !== (orig?.negative_stock_check ?? 0)) ||
            (draft.negative_stock_mode !== undefined && draft.negative_stock_mode !== (orig?.negative_stock_mode ?? 0)) ||
            (draft.quantity_validation_flag !== undefined && draft.quantity_validation_flag !== (orig?.quantity_validation_flag ?? 0))
        );
    };

    const saveRow = async (docId: number) => {
        const draft = drafts.get(docId);
        if (!draft) return;
        const existing = itemMap.get(Number(docId));
        setSavingIds((p) => new Set(p).add(docId));
        try {
            await ICOptionListService.upsert(
                {
                    ic_option_id: Number(icOptionId),
                    system_document_id: Number(docId),
                    sort_order: existing?.sort_order ?? 1,
                    negative_stock_check: getValue(docId, 'negative_stock_check'),
                    negative_stock_mode: getValue(docId, 'negative_stock_mode'),
                    quantity_validation_flag: getValue(docId, 'quantity_validation_flag'),
                },
                existing?.option_list_id
            );
            setDrafts((prev) => {
                const next = new Map(prev);
                next.delete(docId);
                return next;
            });
            toast('บันทึกสำเร็จ', 'success');
            onSaved();
        } catch {
            toast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setSavingIds((p) => { const n = new Set(p); n.delete(docId); return n; });
        }
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-20 whitespace-nowrap">Link IC</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">ชื่อรายการเอกสาร</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 min-w-[180px]">ตรวจสอบสินค้าติดลบ</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 min-w-[160px]">ตรวจสอบจำนวนสินค้า</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 min-w-[220px]">ตรวจสินค้าติดลบด้วย</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-20">บันทึก</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800/50">
                    {documents.map((doc) => {
                        const docId = doc.system_document_id;
                        const isSaving = savingIds.has(docId);
                        const dirty = isDirtyRow(docId);
                        return (
                            <tr
                                key={docId}
                                className={`transition-colors ${dirty ? 'bg-amber-50/40 dark:bg-amber-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <td className="px-3 py-2">
                                    <span className="inline-flex items-center justify-center w-10 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md border border-indigo-200 dark:border-indigo-800">
                                        {doc.system_document_code}
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{doc.system_document_name}</td>
                                <td className="px-3 py-2">
                                    <OptionSelectCell
                                        value={getValue(docId, 'negative_stock_check')}
                                        options={NEGATIVE_STOCK_CHECK_OPTIONS}
                                        onChange={(v) => setDraft(docId, 'negative_stock_check', v)}
                                        isSaving={isSaving}
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <OptionSelectCell
                                        value={getValue(docId, 'negative_stock_mode')}
                                        options={NEGATIVE_STOCK_MODE_OPTIONS}
                                        onChange={(v) => setDraft(docId, 'negative_stock_mode', v)}
                                        isSaving={isSaving}
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <OptionSelectCell
                                        value={getValue(docId, 'quantity_validation_flag')}
                                        options={QUANTITY_VALIDATION_OPTIONS}
                                        onChange={(v) => setDraft(docId, 'quantity_validation_flag', v)}
                                        isSaving={isSaving}
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {dirty && (
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => saveRow(docId)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                                        >
                                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                            {isSaving ? '...' : 'บันทึก'}
                                        </button>
                                    )}
                                    {!dirty && itemMap.has(docId) && (
                                        <span className="text-[10px] text-gray-400">✓</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export function ICOptionListTab({ icOptionId }: Props) {
    const queryClient = useQueryClient();

    const qkDocs = useMemo(() => ['system-documents'], []);
    const qkList = useMemo(() => ['ic-option-list', icOptionId], [icOptionId]);

    const { data: documents = [], isLoading: loadingDocs } = useQuery({
        queryKey: qkDocs,
        queryFn: () => SystemDocumentService.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: listItems = [], isLoading: loadingList } = useQuery({
        queryKey: qkList,
        queryFn: () => ICOptionListService.getByICOptionId(icOptionId),
        enabled: !!icOptionId,
    });

    const itemMap = useMemo(() => {
        const map = new Map<number, ICOptionListItem>();
        listItems
            .filter((item) => String(item.ic_option_id) === String(icOptionId))
            .forEach((item) => map.set(Number(item.system_document_id), item));
        return map;
    }, [listItems, icOptionId]);

    const handleSaved = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: qkList });
    }, [queryClient, qkList]);

    const isLoading = loadingDocs || loadingList;

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-sm">กำลังโหลดข้อมูล...</span>
                </div>
            ) : documents.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                    ไม่พบข้อมูล System Document
                </div>
            ) : (
                <GridTab
                    documents={documents}
                    itemMap={itemMap}
                    icOptionId={Number(icOptionId)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
