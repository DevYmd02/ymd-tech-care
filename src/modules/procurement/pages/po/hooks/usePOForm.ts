import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POService, VQService } from '@/modules/procurement/services';
import { POFormSchema, CreatePOSchema, type POFormData } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types/po-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';
import toast from 'react-hot-toast';

// ====================================================================================
// CONFIG
// ====================================================================================

interface UsePOFormOptions {
    isOpen:         boolean;
    onClose:        () => void;
    onSuccess?:     () => void;
    poId?:          number; // Handle numeric ID
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
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    
    // ── Master Data Queries ──────────────────────────────────────────────────
    const { data: branches = [],   isLoading: isLoadingBranches }   = useQuery({ queryKey: ['master-branches'],   queryFn: MasterDataService.getBranches,   enabled: isOpen });
    const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({ queryKey: ['master-warehouses'], queryFn: MasterDataService.getWarehouses, enabled: isOpen });
    const { data: taxCodes = [],   isLoading: isLoadingTaxCodes }   = useQuery({ queryKey: ['master-tax-codes'], queryFn: TaxCodeService.getTaxCodes,     enabled: isOpen });
    const { data: units = [],      isLoading: isLoadingUnits }      = useQuery({ queryKey: ['master-units'],      queryFn: MasterDataService.getUnits,        enabled: isOpen });
    const { data: currencies = [], isLoading: isLoadingCurrencies } = useQuery({ queryKey: ['master-currencies'], queryFn: MasterDataService.getCurrencies,   enabled: isOpen });


    // ── Form ──────────────────────────────────────────────────────────────────
    const formMethods = useForm<POFormData>({
        resolver: zodResolver(POFormSchema) as Resolver<POFormData>,
        defaultValues: {
            po_no: undefined,
            po_date: new Date().toISOString().split('T')[0],
            qc_id: undefined,
            qc_no: undefined,
            pr_id: undefined,
            pr_no: undefined,
            vendor_id: undefined,
            vendor_name: undefined,
            branch_id: undefined,
            ship_to_warehouse_id: undefined,
            is_multicurrency: false,
            currency_code: 'THB',
            target_currency: undefined,
            exchange_rate_date: new Date().toISOString().split('T')[0],
            exchange_rate: 1,
            payment_term_days: 30,
            delivery_date: '',
            remarks: '',
            tax_code_id: undefined,
            po_lines: [],
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
    const { fields, append, remove, replace } = useFieldArray({ control, name: 'po_lines' });

    const watchVendorName      = useWatch({ control, name: 'vendor_name' });
    const watchPrNo            = useWatch({ control, name: 'pr_no' });
    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' });
    const watchIsMulticurrency = useWatch({ control, name: 'is_multicurrency' });

    // ── VQ Inheritance Query (read-only cross-module lookup) ──────────────────
    const { data: inheritedVQ } = useQuery({
        queryKey: ['inherit-vq', initialValues?.rfq_id, initialValues?.winning_vq_id, initialValues?.vendor_id],
        queryFn: async () => {
            if ((!initialValues?.rfq_id && !initialValues?.winning_vq_id) || !initialValues?.vendor_id) return null;
            const res = await VQService.getList({});
            // Find VQ by searching for vendor and matching RFQ/VQ ID
            const sourceVQ = res.data.find(vq => 
                vq.vendor_id === initialValues.vendor_id && 
                (vq.rfq_id === initialValues.rfq_id || vq.vq_header_id === initialValues.winning_vq_id || vq.quotation_id === initialValues.winning_vq_id)
            );
            
            if (sourceVQ?.vq_header_id || sourceVQ?.quotation_id) {
                return await VQService.getById(sourceVQ.vq_header_id || sourceVQ.quotation_id!);
            }
            return null;
        },
        enabled: isOpen && (!!initialValues?.rfq_id || !!initialValues?.winning_vq_id) && !!initialValues?.vendor_id && !isViewMode
    });

    // ── Form Reset Effect (Hydration) ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            let initialPOLines: POFormData['po_lines'] = [];
            
            // Phase 1: Direct PO Lines from internal or partial initialValues
            if (initialValues?.po_lines && initialValues.po_lines.length > 0) {
                initialPOLines = initialValues.po_lines as POFormData['po_lines'];
            } 
            // Phase 2: Derive from RFQ/VQ inheritance
            else if (inheritedVQ && (inheritedVQ.vq_lines || inheritedVQ.lines)) {
                const sourceLines = (inheritedVQ.vq_lines || inheritedVQ.lines)!;
                initialPOLines = sourceLines.map((l, idx: number) => ({
                    line_no:         idx + 1,
                    item_id:         l.item_id || undefined,
                    item_code:       l.item?.item_code || l.item_code || '',
                    item_name:       l.item?.item_name || l.item_name || '',
                    description:     l.remark || l.item?.item_name || l.item_name || '',
                    pr_line_id:      l.pr_line_id || null,
                    status:          'OPEN',
                    qty:             Number(l.qty) || 1,
                    qty_ordered:     Number(l.qty) || 1,
                    uom_id:          Number(l.uom_id) || 1,
                    unit_price:      Number(l.unit_price) || 0,
                    discount_amount: Number(l.discount_amount) || 0,
                    discount_expression: l.discount_expression || '0',
                    tax_code_id:     l.tax_code_id || inheritedVQ.tax_code_id || undefined,
                    required_receipt_type: 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      Number(l.net_amount) || 0,
                }));
            }

            // Phase 3: Default Empty Row for New PO (not derived from RFQ/VQ)
            if (initialPOLines.length === 0 && !initialValues?.rfq_id && !initialValues?.winning_vq_id) {
                initialPOLines = [{
                    line_no:         1,
                    item_id:         undefined,
                    item_code:       '',
                    item_name:       '',
                    description:     '',
                    pr_line_id:      null,
                    status:          'OPEN',
                    qty:             1,
                    qty_ordered:     1,
                    uom_id:          1,
                    unit_price:      0,
                    discount_amount: 0,
                    discount_expression: '0',
                    tax_code_id:     undefined,
                    required_receipt_type: 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      0,
                }];
            }

            reset({
                po_no:                initialValues?.po_no                ?? undefined,
                po_date:              initialValues?.po_date              ?? new Date().toISOString().split('T')[0],
                rfq_id:               initialValues?.rfq_id               ?? inheritedVQ?.rfq_id ?? undefined,
                winning_vq_id:        initialValues?.winning_vq_id        ?? inheritedVQ?.vq_header_id ?? inheritedVQ?.quotation_id ?? undefined,
                pr_id:                inheritedVQ?.pr_id                  || initialValues?.pr_id || undefined,
                pr_no:                inheritedVQ?.pr_no                  || initialValues?.pr_no || undefined,
                vendor_id:            initialValues?.vendor_id            ?? undefined,
                vendor_name:          initialValues?.vendor_name          ?? undefined,
                branch_id:            initialValues?.branch_id            ?? undefined,
                ship_to_warehouse_id: initialValues?.ship_to_warehouse_id ?? undefined,
                is_multicurrency:     false,
                currency_code:        (inheritedVQ?.base_currency_code || inheritedVQ?.currency || initialValues?.currency_code) ?? 'THB',
                base_currency_code:   inheritedVQ?.base_currency_code || 'THB',
                quote_currency_code:  inheritedVQ?.quote_currency_code || inheritedVQ?.currency || 'THB',
                target_currency:      undefined,
                exchange_rate_date:   new Date().toISOString().split('T')[0],
                exchange_rate:        Number(inheritedVQ?.exchange_rate || initialValues?.exchange_rate || 1),
                payment_term_days:    Number(inheritedVQ?.payment_term_days || initialValues?.payment_term_days || 30),
                delivery_date:        initialValues?.delivery_date ?? '',
                remarks:              initialValues?.remarks ?? '',
                discount_expression:  initialValues?.discount_expression ?? '0',
                tax_code_id:          initialValues?.tax_code_id ?? inheritedVQ?.tax_code_id ?? undefined,
                po_lines:             initialPOLines,
            });
        }
    }, [isOpen, initialValues, reset, inheritedVQ]);

    // ── Enforce THB when Multicurrency is OFF ─────────────────────────────────
    useEffect(() => {
        if (!watchIsMulticurrency) {
            setValue('pr_id', undefined);
            setValue('pr_no', undefined);
            setValue('currency_code', 'THB');
            setValue('exchange_rate', 1);
            setValue('target_currency', undefined);
        }
    }, [watchIsMulticurrency, setValue]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setValue('vendor_id', Number(vendor.vendor_id));
        setValue('vendor_name', vendor.name);
        setIsVendorModalOpen(false);
    };

    const handleSelectQC = (qc: { 
        qc_id: number; 
        qc_no: string; 
        pr_id: number; 
        pr_no: string; 
        vendor_id?: number; 
        vendor_name?: string 
    }) => {
        setValue('qc_id', Number(qc.qc_id));
        setValue('qc_no', qc.qc_no);
        setValue('pr_id', Number(qc.pr_id));
        setValue('pr_no', qc.pr_no);
        if (qc.vendor_id) {
            setValue('vendor_id', Number(qc.vendor_id));
            setValue('vendor_name', qc.vendor_name || '');
        }
        setIsQCModalOpen(false);
    };

    // ── Product Search Handlers ───────────────────────────────────────────────
    const handleOpenProductSearch = useCallback((index: number) => {
        setActiveRowIndex(index);
        setIsProductModalOpen(true);
    }, []);

    const handleSelectProduct = useCallback((product: ItemListItem) => {
        if (activeRowIndex !== null) {
            const currentLines = getValues('po_lines');
            if (currentLines[activeRowIndex]) {
                setValue(`po_lines.${activeRowIndex}.item_id`, Number(product.item_id));
                setValue(`po_lines.${activeRowIndex}.item_code`, product.item_code || '');
                setValue(`po_lines.${activeRowIndex}.item_name`, product.item_name || '');
                setValue(`po_lines.${activeRowIndex}.description`, product.description || product.item_name || '');
                setValue(`po_lines.${activeRowIndex}.uom_id`, Number(product.uom_id || product.unit_id) || 1);
                setValue(`po_lines.${activeRowIndex}.unit_price`, Number(product.standard_cost || 0));
            
                // Recalculate
                const qty = getValues(`po_lines.${activeRowIndex}.qty_ordered`) || 1;
                const price = Number(product.standard_cost || 0);
                const discount = getValues(`po_lines.${activeRowIndex}.discount_amount`) || 0;
                setValue(`po_lines.${activeRowIndex}.line_total`, qty * price - discount);
            }
            setIsProductModalOpen(false);
            setActiveRowIndex(null);
        }
    }, [activeRowIndex, setValue, getValues]);

    const [isHydrating, setIsHydrating] = useState(false);

    const handleSelectPR = async (pr: PRHeader) => {
        const loadingToast = toast.loading('กำลังดึงข้อมูลใบขอซื้อและตั้งค่าสกุลเงิน...');
        setIsHydrating(true);
        try {
            // 1. Fetch full PR detail to get po_lines
            const fullPR = await PRService.getDetail(pr.pr_id);
            
            // 2. Set Header References & Currency Mapping
            setValue('pr_id', Number(pr.pr_id));
            setValue('pr_no', pr.pr_no);

            // 🏛️ Header Tax Code Mapping
            const prTaxCodeId = fullPR.pr_tax_code_id;
            if (prTaxCodeId) {
                setValue('tax_code_id', Number(prTaxCodeId), { shouldValidate: true });
            }

            // 💱 Currency & Multicurrency Mapping (Refined for UI Sync)
            const quoteCurrency = fullPR.pr_quote_currency_code || 'THB';
            const isForeign = quoteCurrency !== 'THB';
            
            // 1. Force UI Update for Multicurrency Panel
            setValue('is_multicurrency', isForeign, { shouldValidate: true, shouldDirty: true });

            // 2. Map Currency Details
            setValue('quote_currency_code', quoteCurrency);
            setValue('currency_code', quoteCurrency);
            setValue('target_currency', isForeign ? quoteCurrency : '');

            if (isForeign) {
                setValue('exchange_rate', Number(fullPR.pr_exchange_rate || 1));
                if (fullPR.pr_exchange_rate_date) {
                    // Try to parse ISO date string, fallback to today
                    const dateObj = new Date(fullPR.pr_exchange_rate_date);
                    const dateStr = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
                    setValue('exchange_rate_date', dateStr.split('T')[0]);
                }
            } else {
                // LOCAL RESET: If THB, reset to defaults
                setValue('exchange_rate', 1);
                setValue('exchange_rate_date', new Date().toISOString().split('T')[0]);
            }
            
            // 3. Deep Auto-Hydration: Map po_lines (STRICT OVERWRITE)
            if (fullPR.lines && fullPR.lines.length > 0) {
                const mappedLines: POFormData['po_lines'] = fullPR.lines.map((l, index) => ({
                    line_no: index + 1,
                    item_id: l.item_id ? Number(l.item_id) : undefined,
                    item_code: l.item?.item_code || l.item_code || '', // 👈 Map to "รหัสสินค้า" (Handle nested item)
                    item_name: l.item_name || '', // 👈 Internal use
                    description: l.description || l.item_name || '', // 👈 Map to "รายละเอียด"
                    pr_line_id: l.pr_line_id ? Number(l.pr_line_id) : null, // 🛡️ Null-Safe ID Linking
                    status: 'OPEN' as const,
                    qty: Number(l.qty) || 1,
                    qty_ordered: Number(l.qty) || 1,
                    uom_id: Number(l.uom_id) || 1, // 🛡️ Null-Safe
                    unit_price: Number(l.est_unit_price) || 0, // 👈 Auto-map price
                    discount_amount: 0,
                    discount_expression: '0',
                    tax_code_id: l.tax_code_id ? Number(l.tax_code_id) : getValues('tax_code_id'), // 🛡️ Null-Safe fallback
                    required_receipt_type: (l.required_receipt_type as "FULL" | "PARTIAL") || 'FULL',
                    receipt_type: 'GOODS' as const,
                    line_total: (Number(l.qty) || 0) * (Number(l.est_unit_price) || 0),
                }));

                // REPLACE entire array (Overwrite)
                replace(mappedLines); 
            }
            
            toast.success(`เชื่อมโยงข้อมูลและสกุลเงินจาก ${pr.pr_no} สำเร็จ`, { id: loadingToast });
        } catch (error) {
            logger.error('[usePOForm] handleSelectPR error:', error);
            toast.error('ไม่สามารถดึงข้อมูลใบขอซื้อได้', { id: loadingToast });
        } finally {
            setIsHydrating(false);
        }
    };

    const handleAddLine = useCallback(() => {
        const nextLineNo = fields.length + 1;
        append({
            line_no:         nextLineNo,
            item_id:         undefined,
            item_code:       '',
            item_name:       '',
            description:     '',
            pr_line_id:      null,
            status:          'OPEN',
            qty:             1,
            qty_ordered:     1,
            uom_id:          1,
            unit_price:      0,
            discount_amount: 0,
            discount_expression: '0',
            tax_code_id:     undefined,
            required_receipt_type: 'FULL',
            receipt_type:    'GOODS' as const,
            line_total:      0,
        });
    }, [append, fields.length]);

    const { user } = useAuth();

    const onSubmit: SubmitHandler<POFormData> = async (data) => {
        try {
            // 🛡️ Data Integrity Guard: Strict Vendor ID Validation
            const safeVendorId = Number(data.vendor_id);
            if (!safeVendorId || isNaN(safeVendorId) || safeVendorId <= 0) {
                throw new Error("Invalid Vendor ID. กรุณาเลือกผู้ขายที่ถูกต้องจากระบบ");
            }

            // STRICT PAYLOAD ARCHITECTURE (Aligned with Backend Contract 100%)
            const fullPayload: CreatePOPayload = {
                rfq_id:             data.rfq_id ? Number(data.rfq_id) : null,
                vendor_id:          safeVendorId,
                branch_id:          Number(data.branch_id),
                warehouse_id:       Number(data.ship_to_warehouse_id),
                base_currency_code: data.base_currency_code || "THB",
                quote_currency_code: data.quote_currency_code || data.currency_code || "THB",
                exchange_rate:      Number(data.exchange_rate || 1),
                exchange_rate_date: data.exchange_rate_date ? new Date(data.exchange_rate_date).toISOString() : new Date().toISOString(),
                tax_code_id:        Number(data.tax_code_id),
                discount_expression: data.discount_expression || "0",
                status:             "DRAFT", // Hardcode DRAFT for new creation
                created_at:         new Date().toISOString(),
                created_by:         Number(user?.id || 1),
                winning_vq_id:      data.winning_vq_id ? Number(data.winning_vq_id) : null,
                po_lines: (data.po_lines || []).map((item, index: number) => ({ // Backend expects 'item' to be included in the payload
                    line_no:        index + 1,
                    item_id:        Number(item.item_id),
                    pr_line_id:     item.pr_line_id ? Number(item.pr_line_id) : null, // Zero-tolerance: number or null
                    status:         "OPEN",
                    qty:            Number(item.qty || item.qty_ordered || 0),
                    uom_id:         Number(item.uom_id),
                    unit_price:     Number(item.unit_price),
                    // Pro-Tip: Tax Fallback Logic
                    tax_code_id:    item.tax_code_id ? Number(item.tax_code_id) : Number(data.tax_code_id),
                    discount_expression: item.discount_expression || "0",
                    required_receipt_type: item.required_receipt_type || "FULL",
                    description:    item.description || ""
                }))
            };

            logger.info("FINAL_PO_PAYLOAD:", fullPayload);

            // 🛡️ Pre-flight validation
            CreatePOSchema.parse(fullPayload);

            await POService.create(fullPayload);

            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('บันทึกใบสั่งซื้อสำเร็จ');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            logger.error('[usePOForm] onSubmit error:', err);
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
        handleSelectQC,
        handleSelectPR,
        handleAddLine,
        onSubmit,
        
        // Modal states
        isVendorModalOpen,
        setIsVendorModalOpen,
        isQCModalOpen,
        setIsQCModalOpen,
        
        isProductModalOpen,
        setIsProductModalOpen,
        isHydrating,
        
        // Data
        branches,
        isLoadingBranches,
        warehouses,
        isLoadingWarehouses,
        taxCodes,
        isLoadingTaxCodes,
        units,
        isLoadingUnits,
        currencies,
        isLoadingCurrencies,
        
        // Handlers
        handleOpenProductSearch,
        handleSelectProduct,

        // Initial Data for UI (Conditional disabling logic)
        isInherited: !!initialValues?.rfq_id || !!initialValues?.winning_vq_id,
        isViewMode,
    };
};