import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POService, VQService } from '@/modules/procurement/services';
import { POFormSchema } from '@/modules/procurement/schemas/po-schemas';
import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';
import toast from 'react-hot-toast';

// ====================================================================================
// CONFIG
// ====================================================================================

interface UsePOFormOptions {
    isOpen:         boolean;
    onClose:        () => void;
    onSuccess?:     () => void;
    poId?:          string;
    initialValues?: Partial<POFormData>;
    isViewMode?:    boolean;
}

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOForm = ({
    isOpen,
    onClose,
    onSuccess,
    initialValues,
    isViewMode = false,
}: UsePOFormOptions) => {
    const queryClient = useQueryClient();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllItems, setShowAllItems] = useState(false);
    
    // Dummy products for the modal until MasterData is fully wired here
    const isSearchingProducts = false;
    const products: ItemListItem[] = [
        { item_id: '1', item_code: 'ITEM-001', item_name: 'กระดาษ A4', description: 'กระดาษ A4 80 แกรม', unit_name: 'REAM', unit_id: '1', standard_cost: 100, category_name: 'Office Supplies', is_active: true, created_at: new Date().toISOString() },
        { item_id: '2', item_code: 'ITEM-002', item_name: 'ปากกาน้ำเงิน', description: 'ปากกาลูกลื่น 0.5mm', unit_name: 'PCS', unit_id: '2', standard_cost: 3, category_name: 'Office Supplies', is_active: true, created_at: new Date().toISOString() },
    ];

    // ── Form ──────────────────────────────────────────────────────────────────
    const formMethods = useForm<POFormData>({
        resolver: zodResolver(POFormSchema) as Resolver<POFormData>,
        defaultValues: {
            po_no:                '',
            po_date:              new Date().toISOString().split('T')[0],
            qc_id:                '',
            qc_no:                '',
            pr_id:                '',
            pr_no:                '',
            vendor_id:            '',
            vendor_name:          '',
            branch_id:            '',
            ship_to_warehouse_id: '',
            is_multicurrency:     false,
            currency_code:        'THB',
            target_currency:      undefined,
            exchange_rate_date:   new Date().toISOString().split('T')[0],
            exchange_rate:        1,
            payment_term_days:    30,
            delivery_date:        '',
            remarks:              '',
            lines:                [],
        },
    });

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        formState: { errors },
    } = formMethods;

    // Use `control` explicitly for dynamic fields
    const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

    const watchVendorName      = useWatch({ control, name: 'vendor_name' });
    const watchPrNo            = useWatch({ control, name: 'pr_no' });
    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' });
    const watchIsMulticurrency = useWatch({ control, name: 'is_multicurrency' });

    // ── VQ Inheritance Query (read-only cross-module lookup) ──────────────────
    const { data: inheritedVQ } = useQuery({
        queryKey: ['inherit-vq', initialValues?.qc_id, initialValues?.vendor_id],
        queryFn: async () => {
            if (!initialValues?.qc_id || !initialValues?.vendor_id) return null;
            const res = await VQService.getList({});
            const sourceVQ = res.data.find(vq => vq.qc_id === initialValues.qc_id && vq.vendor_id === initialValues.vendor_id);
            if (sourceVQ?.quotation_id) {
                return await VQService.getById(sourceVQ.quotation_id);
            }
            return null;
        },
        enabled: isOpen && !!initialValues?.qc_id && !!initialValues?.vendor_id && !isViewMode
    });

    // ── Form Reset Effect (Hydration) ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            let initialLines = initialValues?.lines || [];

            // Phase 3 Hydration: Auto-populate lines ONLY if they don't exist yet and we just fetched from VQ
            if (initialLines.length === 0 && inheritedVQ?.lines && inheritedVQ.lines.length > 0) {
                initialLines = inheritedVQ.lines.map((l) => ({
                    item_id:         l.item_id || '',
                    item_code:       l.item_code || '',
                    item_name:       l.item_name || '',
                    description:     l.item_name || '',
                    qty_ordered:     l.qty || 1,
                    uom_id:          l.uom_id || 'PCS',
                    // CRITICAL: Must use the winning price from VQ, NOT standard general cost
                    unit_price:      l.unit_price || 0,
                    discount_amount: l.discount_amount || 0,
                    tax_code:        l.tax_code || 'VAT',
                    receipt_type:    'GOODS' as const,
                    line_total:      l.net_amount || 0,
                }));
            }

            // Phase 3: Default Empty Row for New PO
            if (initialLines.length === 0 && !initialValues?.qc_id) {
                initialLines = [{
                    item_id:         '',
                    item_code:       '',
                    item_name:       '',
                    description:     '',
                    qty_ordered:     1,
                    uom_id:          'PCS',
                    unit_price:      0,
                    discount_amount: 0,
                    tax_code:        'VAT',
                    receipt_type:    'GOODS' as const,
                    line_total:      0,
                }];
            }

            reset({
                po_no:                initialValues?.po_no                ?? '',
                po_date:              initialValues?.po_date              ?? new Date().toISOString().split('T')[0],
                qc_id:                initialValues?.qc_id                ?? '',
                qc_no:                initialValues?.qc_no                ?? '',
                pr_id:                inheritedVQ?.pr_id                  || initialValues?.pr_id || '',
                pr_no:                inheritedVQ?.pr_no                  || initialValues?.pr_no || '',
                vendor_id:            initialValues?.vendor_id            ?? '',
                vendor_name:          initialValues?.vendor_name          ?? '',
                branch_id:            initialValues?.branch_id            ?? '',
                ship_to_warehouse_id: initialValues?.ship_to_warehouse_id ?? '',
                is_multicurrency:     false,
                currency_code:        (inheritedVQ?.currency || initialValues?.currency_code) ?? 'THB',
                target_currency:      undefined,
                exchange_rate_date:   new Date().toISOString().split('T')[0],
                exchange_rate:        (inheritedVQ?.exchange_rate || initialValues?.exchange_rate) ?? 1,
                payment_term_days:    (inheritedVQ?.payment_term_days || initialValues?.payment_term_days) ?? 30,
                delivery_date:        initialValues?.delivery_date ?? '',
                remarks:              initialValues?.remarks ?? '',
                lines:                initialLines,
            });
        }
    }, [isOpen, initialValues, reset, inheritedVQ]);

    // ── Enforce THB when Multicurrency is OFF ─────────────────────────────────
    useEffect(() => {
        if (!watchIsMulticurrency) {
            setValue('currency_code', 'THB');
            setValue('exchange_rate', 1);
            setValue('target_currency', undefined);
        }
    }, [watchIsMulticurrency, setValue]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = useCallback((vendor: VendorSearchItem) => {
        setValue('vendor_id',   vendor.vendor_id);
        setValue('vendor_name', vendor.name);
        if (vendor.payment_term_days) {
            setValue('payment_term_days', vendor.payment_term_days);
        }
        setIsVendorModalOpen(false);
    }, [setValue]);

    // ── Product Search Handlers ───────────────────────────────────────────────
    const handleOpenProductSearch = useCallback((index: number) => {
        setActiveRowIndex(index);
        setSearchTerm('');
        setIsProductModalOpen(true);
    }, []);

    const handleSelectProduct = useCallback((product: ItemListItem) => {
        if (activeRowIndex !== null) {
            setValue(`lines.${activeRowIndex}.item_id`, product.item_id);
            setValue(`lines.${activeRowIndex}.item_code`, product.item_code || '');
            setValue(`lines.${activeRowIndex}.item_name`, product.item_name || '');
            setValue(`lines.${activeRowIndex}.description`, product.item_name || '');
            setValue(`lines.${activeRowIndex}.uom_id`, product.unit_id || 'PCS');
            setValue(`lines.${activeRowIndex}.unit_price`, product.standard_cost || 0);
            
            // Recalculate
            const qty = getValues(`lines.${activeRowIndex}.qty_ordered`) || 1;
            const price = product.standard_cost || 0;
            const discount = getValues(`lines.${activeRowIndex}.discount_amount`) || 0;
            setValue(`lines.${activeRowIndex}.line_total`, qty * price - discount);
            
            setIsProductModalOpen(false);
            setActiveRowIndex(null);
        }
    }, [activeRowIndex, setValue, getValues]);

    const handleAddLine = useCallback(() => {
        append({
            item_id:         '',
            item_code:       '',
            item_name:       '',
            description:     '',
            qty_ordered:     1,
            uom_id:          'PCS',
            unit_price:      0,
            discount_amount: 0,
            tax_code:        'VAT',
            receipt_type:    'GOODS' as const,
            line_total:      0,
        });
    }, [append]);

    const onSubmit: SubmitHandler<POFormData> = async (data) => {
        try {
            const subtotal = data.lines.reduce((s, l) => s + l.qty_ordered * l.unit_price - (l.discount_amount ?? 0), 0);
            const tax      = subtotal * 0.07;

            await POService.create({
                qc_id:             data.qc_id ?? '',
                qc_no:             data.qc_no,
                pr_id:             data.pr_id,
                pr_no:             data.pr_no,
                vendor_id:         data.vendor_id,
                vendor_name:       data.vendor_name,
                order_date:        data.po_date,
                delivery_date:     data.delivery_date,
                payment_term_days: data.payment_term_days,
                currency_code:     data.currency_code,
                exchange_rate:     data.exchange_rate,
                total_amount:      subtotal + tax,
                items: data.lines.map(l => ({
                    item_id:         l.item_id || undefined,
                    item_code:       l.item_code,
                    item_name:       l.item_name,
                    description:     l.description,
                    qty_ordered:     l.qty_ordered,
                    unit_price:      l.unit_price,
                    discount_amount: l.discount_amount ?? 0,
                    uom_id:          l.uom_id,
                    tax_code:        l.tax_code,
                    line_total:      l.line_total,
                    receipt_type:    l.receipt_type,
                })),
                remarks:           data.remarks,
            });

            // Auto-Refresh: invalidate PO list cache
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('บันทึกใบสั่งซื้อสำเร็จ');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('[usePOForm] onSubmit error:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
        }
    };

    return {
        // Form
        formMethods,
        control,
        register,
        handleSubmit,
        errors,
        fields,
        append,
        remove,
        setValue,
        
        // Watched values
        watchVendorName,
        watchPrNo,
        watchCurrencyCode,
        watchIsMulticurrency,
        
        // Handlers
        handleVendorSelect,
        handleAddLine,
        onSubmit,
        
        // Vendor modal state
        isVendorModalOpen,
        setIsVendorModalOpen,
        
        // Product Search Modal states
        isProductModalOpen,
        setIsProductModalOpen,
        searchTerm,
        setSearchTerm,
        showAllItems,
        setShowAllItems,
        products,
        isSearchingProducts,
        handleOpenProductSearch,
        handleSelectProduct,

        // Flags
        isViewMode,
    };
};