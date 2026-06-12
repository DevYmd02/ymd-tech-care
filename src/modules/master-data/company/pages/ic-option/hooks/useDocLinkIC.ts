import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { DocLinkICService } from '../services/doc-link-ic.service';
import { SystemDocumentService } from '@/shared/ic-option';
import type { DocLinkIC, DocLinkICCreatePayload, DocLinkICUpdatePayload, DocLinkICItem } from '../types/doc-link-ic.types';
import type { SystemDocument } from '@/shared/ic-option';
import { extractErrorMessage } from '@/core/api/api';

export type SubItem = { docu_item_id?: string; name: string; stock_effect_ic: 0 | 1 | 2; docu_desc?: string; remark?: string; };
export type EditableRow = Partial<DocLinkIC> & { isNew?: boolean; initial_sub_items?: SubItem[]; system_document_id?: number | null; };

export function useDocLinkIC() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const lastRowRef = useRef<HTMLTableRowElement>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditableRow | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newRowData, setNewRowData] = useState<EditableRow | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isDocFocused, setIsDocFocused] = useState(false);

    const { data: rawList = [], isLoading } = useQuery<DocLinkIC[]>({
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

    const getSubsFor = (item: DocLinkIC): DocLinkICItem[] => {
        const children = subItems.filter(s => Number(s.system_document_id) === Number(item.system_document_id));
        const mappedChildren: DocLinkICItem[] = children.map(s => ({
            docu_item_id: String(s.doc_link_ic_id ?? s.docu_type_id ?? ''),
            docu_type_id: String(s.system_document_id ?? ''),
            docu_item_no: s.doc_type_no ?? 0,
            doc_type_no: s.doc_type_no ?? 0,
            docu_item_name: s.doc_type_name || '',
            doc_type_name: s.doc_type_name || '',
            stock_effect_ic: (s.stock_effect_ic ?? 0) as 0 | 1 | 2,
            is_active: s.is_active ?? true,
            docu_desc: s.docu_desc || '',
            remark: s.remark || ''
        }));

        if (item.doc_type_name) {
            const primary: DocLinkICItem = {
                docu_item_id: String(item.doc_link_ic_id ?? item.docu_type_id ?? ''),
                docu_type_id: String(item.docu_type_id ?? ''),
                docu_item_no: 0,
                doc_type_no: 0,
                docu_item_name: item.doc_type_name,
                doc_type_name: item.doc_type_name,
                stock_effect_ic: (item.stock_effect_ic ?? 0) as 0 | 1 | 2,
                is_active: item.is_active ?? true,
                docu_desc: item.docu_desc || '',
                remark: item.remark || ''
            };
            return [primary, ...mappedChildren];
        }
        return mappedChildren;
    };

    const createMutation = useMutation({
        mutationFn: (data: DocLinkICCreatePayload) => DocLinkICService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('เพิ่มประเภทเอกสารสำเร็จ', 'success');
            setIsAdding(false); setNewRowData(null); setFieldErrors({});
        },
        onError: (err: unknown) => {
            toast(extractErrorMessage(err), 'error');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: DocLinkICUpdatePayload }) => DocLinkICService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
            toast('แก้ไขสำเร็จ', 'success');
            setEditingId(null); setEditData(null); setFieldErrors({});
        },
        onError: (err: unknown) => {
            toast(extractErrorMessage(err), 'error');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => DocLinkICService.remove(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] }); toast('ลบสำเร็จ', 'success'); },
        onError: (err: unknown) => {
            toast(extractErrorMessage(err), 'error');
        },
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
        const subs = getSubsFor(item).map(s => ({ 
            docu_item_id: String(s.docu_item_id ?? ''), 
            name: s.doc_type_name || s.docu_item_name || '', 
            stock_effect_ic: (s.stock_effect_ic ?? 0) as 0|1|2, 
            docu_desc: s.docu_desc || '', 
            remark: s.remark || '' 
        }));
        setEditingId(rowKey);
        setEditData({
            ...item,
            docu_type_code: item.docu_type_code || sysdoc?.system_document_code || '',
            docu_name_th: item.docu_name_th || sysdoc?.system_document_name || '',
            docu_name_en: item.docu_name_en || sysdoc?.system_document_name_eng || sysdoc?.system_document_name || '',
            initial_sub_items: subs
        });
        setIsAdding(false); setNewRowData(null); setFieldErrors({});
    };

    const handleCancel = () => {
        setIsAdding(false); setNewRowData(null); setEditingId(null); setEditData(null); setFieldErrors({});
    };

    const handleSaveNew = async () => {
        if (!newRowData) return;
        const errs: Record<string, string> = {};
        if (!newRowData.system_document_id) errs.system_document_id = 'กรุณาเลือกประเภทเอกสาร';
        
        // Check for duplicate active system document
        if (newRowData.system_document_id) {
            const isDuplicate = parents.some(p => p.is_active && Number(p.system_document_id) === Number(newRowData.system_document_id));
            if (isDuplicate) {
                errs.system_document_id = 'รหัสประเภทเอกสารนี้ถูกกำหนดใช้งานแล้ว';
                toast('รหัสประเภทเอกสารนี้ถูกกำหนดใช้งานแล้ว กรุณาเลือกประเภทเอกสารอื่น', 'error');
            }
        }

        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

        const subs = (newRowData.initial_sub_items || []).filter(s => s.name.trim());
        const primarySub = subs[0];
        const children = subs.slice(1);

        const payload: DocLinkICCreatePayload = {
            system_document_id: Number(newRowData.system_document_id),
            doc_type_name: primarySub?.name || '',
            docu_desc: primarySub?.docu_desc || newRowData.docu_desc || '',
            remark: primarySub?.remark || newRowData.remark || '',
            stock_effect_ic: (primarySub?.stock_effect_ic ?? 0) as 0 | 1 | 2,
            is_active: newRowData.is_active ?? true,
        };

        const result = await createMutation.mutateAsync(payload);
        const createdId = result?.doc_link_ic_id;

        if (createdId && children.length > 0) {
            // Find the max doc_type_no already used by this system_document_id to avoid duplicates
            const existingSubs = rawList.filter(r => Number(r.system_document_id) === Number(newRowData.system_document_id));
            const maxDocTypeNo = existingSubs.reduce((max, r) => Math.max(max, r.doc_type_no ?? 0), 0);

            for (let idx = 0; idx < children.length; idx++) {
                const child = children[idx];
                const docTypeNo = maxDocTypeNo + idx + 1;
                await DocLinkICService.createItem({
                    system_document_id: Number(newRowData.system_document_id),
                    docu_type_id: String(newRowData.system_document_id),
                    docu_item_no: docTypeNo,
                    doc_type_no: docTypeNo,
                    docu_item_name: child.name,
                    doc_type_name: child.name,
                    stock_effect_ic: (child.stock_effect_ic ?? 0) as 0|1|2,
                    docu_desc: child.docu_desc || '',
                    remark: child.remark || '',
                    is_active: true
                });
            }
            queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
        }
    };

    const handleSaveEdit = async () => {
        if (!editData || !editingId) return;
        const subs = (editData.initial_sub_items || []).filter(s => s.name.trim());
        const primarySub = subs[0];
        
        // 1) Await parent update to complete first
        await updateMutation.mutateAsync({ 
            id: editingId, 
            data: { 
                doc_type_name: primarySub?.name || '',
                docu_desc: primarySub?.docu_desc || editData.docu_desc || '', 
                remark: primarySub?.remark || editData.remark || '', 
                stock_effect_ic: (primarySub?.stock_effect_ic ?? editData.stock_effect_ic ?? 0) as 0|1|2, 
                is_active: editData.is_active ?? false 
            } 
        });

        const parentRow = rawList.find(r => String(r.doc_link_ic_id ?? r.docu_type_id) === editingId);
        const systemDocId = parentRow ? Number(parentRow.system_document_id) : null;
        const origSubs = parentRow ? getSubsFor(parentRow) : [];
        const childSubs = subs.slice(1);
        const origChildren = origSubs.filter(o => o.doc_type_no !== undefined && o.doc_type_no !== null && o.doc_type_no > 0);
        const newIds = new Set(childSubs.filter(s => s.docu_item_id).map(s => s.docu_item_id!));
        
        // 2) Delete removed sub-items FIRST — await all deletions before creating new ones
        const deletions = origChildren
            .filter(orig => !newIds.has(String(orig.docu_item_id)))
            .map(orig => DocLinkICService.removeItem(String(orig.docu_item_id)));
        await Promise.all(deletions);
        
        // 3) Now update existing and create new sub-items sequentially
        // Use unique doc_type_no values starting after existing max
        const remainingOrigIds = new Set(origChildren.filter(o => newIds.has(String(o.docu_item_id))).map(o => String(o.docu_item_id)));
        const allExistingSubs = rawList.filter(r => Number(r.system_document_id) === systemDocId);
        const maxDocTypeNo = allExistingSubs.reduce((max, r) => Math.max(max, r.doc_type_no ?? 0), 0);
        let nextDocTypeNo = maxDocTypeNo + 1;

        for (let idx = 0; idx < childSubs.length; idx++) {
            const child = childSubs[idx];
            if (child.docu_item_id && remainingOrigIds.has(child.docu_item_id)) {
                // Update existing sub-item — keep its current doc_type_no to avoid collision
                await DocLinkICService.updateItem(child.docu_item_id, {
                    doc_type_name: child.name,
                    stock_effect_ic: (child.stock_effect_ic ?? 0) as 0|1|2,
                    docu_desc: child.docu_desc || '',
                    remark: child.remark || '',
                    is_active: true
                });
            } else {
                // Create new sub-item with a unique doc_type_no
                await DocLinkICService.createItem({
                    system_document_id: systemDocId ?? undefined,
                    docu_type_id: String(systemDocId ?? editingId),
                    docu_item_no: nextDocTypeNo,
                    doc_type_no: nextDocTypeNo,
                    docu_item_name: child.name,
                    doc_type_name: child.name,
                    stock_effect_ic: (child.stock_effect_ic ?? 0) as 0|1|2,
                    docu_desc: child.docu_desc || '',
                    remark: child.remark || '',
                    is_active: true
                });
                nextDocTypeNo++;
            }
        }
        queryClient.invalidateQueries({ queryKey: ['doc-link-ic'] });
    };

    const handleDelete = async (id: string) => {
        if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
            deleteMutation.mutate(id);
        }
    };

    return {
        rawList,
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
        isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
        handleAddClick,
        handleEditClick,
        handleCancel,
        handleSaveNew,
        handleSaveEdit,
        handleDelete,
    };
}
