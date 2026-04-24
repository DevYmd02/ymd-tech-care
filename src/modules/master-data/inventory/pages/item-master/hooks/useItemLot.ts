import { useState, useCallback, useMemo, useEffect} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemLotService } from '@inventory/services/item-lot.service';
import { initialItemLotFormData, type ItemLot, type ItemLotFormData } from '@inventory/types/item-lot-types';
import { logger } from '@/shared/utils/logger';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { addDays, format, isValid, parseISO } from 'date-fns';

interface ItemLotDraft extends ItemLotFormData {
    _tempId: number;
}

export function useItemLot(itemId: number, shelfLifeDays: number = 0) {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();

    // drafts for new lots
    const [drafts, setDrafts] = useState<ItemLotDraft[]>([]);
    
    // editing state for existing lots
    const [editingLotId, setEditingLotId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<ItemLotFormData | null>(null);

    // Reset state when itemId changes to prevent data leakage between items
    useEffect(() => {
        setDrafts([]);
        setEditingLotId(null);
        setEditFormData(null);
    }, [itemId]);

    // ==================== DATA FETCHING ====================
    const { data: lots = [], isLoading } = useQuery({
        queryKey: ['item-lots', itemId],
        queryFn: () => ItemLotService.getList(itemId),
        enabled: itemId > 0,
    });

    // ==================== SUMMARY CALCULATIONS ====================
    const summary = useMemo(() => {
        return lots.reduce((acc, lot: ItemLot) => ({
            totalStock: acc.totalStock + lot.qty_stock,
            totalReserved: acc.totalReserved + lot.qty_reserved,
            totalAvailable: acc.totalAvailable + lot.qty_available,
            totalIssued: acc.totalIssued + (lot.qty_issued || 0),
            expiredCount: acc.expiredCount + (lot.expiry_date && parseISO(lot.expiry_date) < new Date() ? 1 : 0)
        }), { totalStock: 0, totalReserved: 0, totalAvailable: 0, totalIssued: 0, expiredCount: 0 } as { totalStock: number; totalReserved: number; totalAvailable: number; totalIssued: number; expiredCount: number });
    }, [lots]);

    // ==================== MUTATIONS ====================
    const upsertMutation = useMutation({
        mutationFn: (data: ItemLotFormData) => ItemLotService.upsert(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['item-lots', itemId] });
            
            // Clear editing state if it was an edit
            if (variables.lot_id === editingLotId) {
                setEditingLotId(null);
                setEditFormData(null);
            }
        },
        onError: (error: Error) => {
            logger.error('Upsert lot error:', error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (lotId: number) => ItemLotService.delete(lotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item-lots', itemId] });
        }
    });

    // ==================== HANDLERS FOR DRAFTS (NEW) ====================
    const handleAddDraft = useCallback(() => {
        setDrafts(prev => [...prev, { ...initialItemLotFormData(itemId), _tempId: Math.random() }]);
    }, [itemId]);

    const handleRemoveDraft = useCallback((tempId: number) => {
        setDrafts(prev => prev.filter(d => d._tempId !== tempId));
    }, []);

    const handleDraftInputChange = useCallback((tempId: number, name: keyof ItemLotFormData, value: string | number | null) => {
        setDrafts(prev => prev.map(d => {
            if (d._tempId !== tempId) return d;
            
            const newData = { ...d, [name]: value };
            if (name === 'mfg_date' && value && shelfLifeDays > 0) {
                const mfgDate = parseISO(String(value));
                if (isValid(mfgDate)) {
                    newData.expiry_date = format(addDays(mfgDate, shelfLifeDays), 'yyyy-MM-dd');
                }
            }
            return newData;
        }));
    }, [shelfLifeDays]);

    const handleSaveDraft = useCallback((tempId: number) => {
        const draft = drafts.find(d => d._tempId === tempId);
        if (!draft) return;
        if (!draft.lot_no) {
            alert('กรุณากรอกเลขล็อต');
            return;
        }
        
        // Remove _tempId before sending to API safely
        const { _tempId, ...payload } = draft;
        
        upsertMutation.mutate(payload as ItemLotFormData, {
            onSuccess: () => {
                handleRemoveDraft(tempId);
            }
        });
    }, [drafts, upsertMutation, handleRemoveDraft]);

    const handleSaveAllDrafts = useCallback(async () => {
        const validDrafts = drafts.filter(d => d.lot_no);
        if (validDrafts.length === 0) {
            alert('กรุณากรอกเลขล็อตอย่างน้อย 1 รายการ');
            return;
        }

        const isConfirmed = await confirm({
            title: 'ยืนยันการบันทึกทั้งหมด',
            description: `คุณต้องการบันทึกข้อมูล Lot ทั้งหมด ${validDrafts.length} รายการ ใช่หรือไม่?`,
            confirmText: 'บันทึกทั้งหมด',
            variant: 'success'
        });

        if (!isConfirmed) return;

        // Save each draft sequentially to avoid race conditions and ensure stability
        for (const draft of validDrafts) {
            const { _tempId, ...payload } = draft;
            await upsertMutation.mutateAsync(payload as ItemLotFormData);
            handleRemoveDraft(draft._tempId);
        }
        return true;
    }, [drafts, upsertMutation, handleRemoveDraft, confirm]);

    const handleRemoveAllDrafts = useCallback(() => {
        setDrafts([]);
    }, []);

    // ==================== HANDLERS FOR EDITING (EXISTING) ====================
    const handleOpenEditForm = useCallback((lot: ItemLot) => {
        setEditingLotId(lot.lot_id);
        setEditFormData({
            lot_id: lot.lot_id,
            lot_no: lot.lot_no,
            item_id: lot.item_id,
            supplier_vendor_id: lot.supplier_vendor_id,
            mfg_date: lot.mfg_date ? format(parseISO(lot.mfg_date), 'yyyy-MM-dd') : null,
            expiry_date: lot.expiry_date ? format(parseISO(lot.expiry_date), 'yyyy-MM-dd') : null,
            status: lot.status,
            note: lot.note
        });
    }, []);

    const handleCloseEditForm = useCallback(() => {
        setEditingLotId(null);
        setEditFormData(null);
    }, []);

    const handleEditInputChange = useCallback((name: keyof ItemLotFormData, value: string | number | null) => {
        setEditFormData(prev => {
            if (!prev) return null;
            const newData = { ...prev, [name]: value };
            if (name === 'mfg_date' && value && shelfLifeDays > 0) {
                const mfgDate = parseISO(String(value));
                if (isValid(mfgDate)) {
                    newData.expiry_date = format(addDays(mfgDate, shelfLifeDays), 'yyyy-MM-dd');
                }
            }
            return newData;
        });
    }, [shelfLifeDays]);

    const handleSaveEdit = useCallback(() => {
        if (!editFormData || !editFormData.lot_no) {
            alert('กรุณากรอกเลขล็อต');
            return;
        }
        upsertMutation.mutate(editFormData);
    }, [editFormData, upsertMutation]);

    const handleDelete = useCallback(async (lotId: number, lotNo: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบล็อต?',
            description: `ต้องการลบเลขล็อต ${lotNo} ใช่หรือไม่?`,
            variant: 'danger'
        });
        if (isConfirmed) {
            deleteMutation.mutate(lotId);
        }
    }, [confirm, deleteMutation]);

    return {
        lots,
        isLoading,
        summary,
        
        // Drafts (New)
        drafts,
        handleAddDraft,
        handleRemoveDraft,
        handleDraftInputChange,
        handleSaveDraft,
        handleSaveAllDrafts,
        handleRemoveAllDrafts,
        
        // Editing (Existing)
        editingLotId,
        editFormData,
        handleOpenEditForm,
        handleCloseEditForm,
        handleEditInputChange,
        handleSaveEdit,
        
        handleDelete,
        isSaving: upsertMutation.isPending
    };
}
