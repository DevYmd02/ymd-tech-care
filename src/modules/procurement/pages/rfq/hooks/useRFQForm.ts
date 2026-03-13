import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MasterDataService } from '@/modules/master-data';
import type { BranchListItem, ItemListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { RFQVendor, RFQLine, RFQDetailResponse, RFQStatus } from '@/modules/procurement/types/rfq-types';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { PRHeader } from '@/modules/procurement/types';
import type { Resolver } from 'react-hook-form';
import { PRService } from '@/modules/procurement/services/pr.service';
import { RFQService, type RFQCreateDTO, type RFQLineDTO } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { 
    RFQFormSchema, 
    type RFQFormValues, 
    type RFQLineValues, 
    type RFQVendorValues,
    getRFQDefaultFormValues,
    createEmptyRFQLine
} from '@/modules/procurement/schemas/rfq-schemas';

/**
 * 🔄 Data Mapper: Converts PR Detail into RFQ Form Data
 * @param pr PR Header with lines (from real API — may be missing item_code/item_name/uom)
 * @param itemsMap Optional: pre-loaded items for enriching item_code & item_name by item_id
 * @param unitsMap Optional: pre-loaded units for enriching uom string by uom_id
 * @returns RFQ Form Data (Partial/Full)
 */
export const mapPRToRFQFormData = (
    pr: PRHeader,
    itemsMap?: ItemListItem[],
    unitsMap?: UnitListItem[],
): Partial<RFQFormValues> => {
    const isMulti = pr.pr_base_currency_code !== 'THB';
    
    return {
        pr_id: pr.pr_id,
        pr_no: pr.pr_no,
        branch_id: pr.branch_id,
        project_id: pr.project_id || null,
        purpose: pr.purpose || '',
        cost_center_id: pr.cost_center_id ? Number(pr.cost_center_id) : undefined,
        pr_tax_code_id: pr.pr_tax_code_id || undefined,
        pr_tax_rate: pr.pr_tax_rate || undefined,
        
        // Currency Sync
        isMulticurrency: isMulti,
        rfq_base_currency_code: pr.pr_base_currency_code,
        rfq_quote_currency_code: pr.pr_quote_currency_code || 'THB',
        rfq_exchange_rate: pr.pr_exchange_rate || 1,
        rfq_exchange_rate_date: pr.pr_exchange_rate_date ? pr.pr_exchange_rate_date.split('T')[0] : '',
        
        // Remark Append Style
        remarks: pr.remark 
            ? `${pr.remark}\n[PR: ${pr.pr_no}]` 
            : `Generated from PR: ${pr.pr_no}`,

        // ⚠️ Safety: Do NOT map IDs for new RFQ record
        rfqLines: (pr.lines || []).map((line, index) => {
            // ── Enrich from master data if backend omitted these fields ──────
            const item_id = line.item_id ? Number(line.item_id) : undefined;
            const uom_id  = Number(line.uom_id) || 0;

            // Look up item from master data by item_id (real API may not include item_code/item_name)
            const masterItem = itemsMap && item_id
                ? itemsMap.find(i => i.item_id === item_id || Number(i.item_id) === item_id)
                : undefined;

            // Look up unit from master data by uom_id (real API may not include uom string)
            const masterUnit = unitsMap && uom_id
                ? unitsMap.find(u => u.unit_id === uom_id || Number(u.unit_id) === uom_id)
                : undefined;

            const item_code = line.item_code || masterItem?.item_code || '';
            const item_name = line.item_name || masterItem?.item_name || '';
            const uom       = line.uom       || masterUnit?.unit_name || masterItem?.unit_name || '';

            logger.debug(`[mapPRToRFQ] line ${index + 1}: item_id=${item_id}, found=${!!masterItem}, item_code=${item_code}, uom_id=${uom_id}, uom=${uom}`);

            return {
                line_no: index + 1,
                item_id,
                item_code,
                item_name,
                description: line.description || item_name,
                qty:      Number(line.qty)            || 1,   // coerce string to number
                uom,
                uom_id:   uom_id || 1,                        // never 0
                required_receipt_type: line.required_receipt_type || 'FULL',
                // Real API may use `needed_date`, `line_needed_date`, or the backend uses another key
                target_delivery_date: (
                    line.needed_date ||
                    (line as unknown as Record<string, unknown>).line_needed_date as string ||
                    ''
                ).toString().split('T')[0] || '',
                note_to_vendor:  line.remark || '',
                pr_line_id:      line.pr_line_id || undefined,
                est_unit_price:  Number(line.est_unit_price) || 0,  // coerce string
                est_amount:      Number(line.est_amount)     || 0,  // coerce string
            };
        }),

        // Preferred Vendor Carryover
        vendors: pr.preferred_vendor_id ? [{
            vendor_id: pr.preferred_vendor_id,
            vendor_code: '',
            vendor_name: pr.vendor_name || '',
            vendor_name_display: pr.vendor_name || '(Preferred Vendor from PR)',
        }] : [],
    };
};

export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void, editId?: number | null) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [stagedPayload, setStagedPayload] = useState<RFQFormValues | null>(null);

    // Track original PR lines for potential reset feature
    const [originalPRLines, setOriginalPRLines] = useState<RFQLineValues[]>([]);

    // Vendor Tracking (for View Mode Only)
    const [trackingVendors, setTrackingVendors] = useState<Array<RFQVendor & { vendor_code?: string; vendor_name?: string }>>([]);

    // 🏗️ React Hook Form Setup
    const methods = useForm<RFQFormValues>({
        resolver: zodResolver(RFQFormSchema) as Resolver<RFQFormValues>,
        defaultValues: getRFQDefaultFormValues(),
        mode: 'onBlur',
    });

    const { control, handleSubmit, reset, setValue, getValues, formState: { errors } } = methods;

    const { fields: lineFields, append: appendLine, remove: removeLine } = useFieldArray({
        control,
        name: 'rfqLines',
    });

    const { append: appendVendor, remove: removeVendor } = useFieldArray({
        control,
        name: 'vendors',
    });

    // Master Data State
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [units, setUnits] = useState<UnitListItem[]>([]);

    // PR Selection State
    const [isPRSelectionModalOpen, setIsPRSelectionModalOpen] = useState(false);

    // Fetch Master Data
    useEffect(() => {
        if (!isOpen) return;
        const fetchMasterData = async () => {
            try {
                const [branchesData, itemsData, unitsData] = await Promise.all([
                    MasterDataService.getBranches(),
                    MasterDataService.getItems(),
                    MasterDataService.getUnits()
                ]);
                setBranches(branchesData);
                setItems(itemsData);
                setUnits(unitsData);
            } catch (error) {
                logger.error('Failed to fetch master data:', error);
            }
        };
        fetchMasterData();
    }, [isOpen]);

    // ========================================================================
    // BRANCH 1: Edit Existing RFQ
    // ========================================================================
    useEffect(() => {
        if (!isOpen || !editId) return;

        const fetchRFQDetails = async () => {
            setIsLoadingEdit(true);
            try {
                const rfqId = Number(editId);
                const rfq = await RFQService.getById(rfqId) as RFQDetailResponse;
                if (!rfq) return;

                const sourceVendors = rfq.rfqVendors || rfq.vendors || [];
                const sourceLines = rfq.rfqLines || rfq.lines || [];

                // Hydrate vendor details if missing from backend (since standard backend list only has vendor_id)
                const enhancedVendors = await Promise.all(sourceVendors.map(async (v) => {
                    if (v.vendor_name && v.vendor_code) return v;
                    try {
                        const vendorDetail = await VendorService.getById(v.vendor_id);
                        if (vendorDetail) {
                            return {
                                ...v,
                                vendor_name: vendorDetail.vendor_name || v.vendor_name || '',
                                vendor_code: vendorDetail.vendor_code || v.vendor_code || '',
                            };
                        }
                    } catch {
                         logger.warn('Failed to fetch vendor detail for id', v.vendor_id);
                    }
                    return v;
                }));

                setTrackingVendors(enhancedVendors);

                const mappedVendors: RFQVendorValues[] = enhancedVendors.map((v) => ({
                    vendor_id: v.vendor_id,
                    vendor_code: v.vendor_code || '',
                    vendor_name: v.vendor_name || '',
                    vendor_name_display: v.vendor_code ? `${v.vendor_code} - ${v.vendor_name}` : v.vendor_name || '',
                    is_existing: true,
                }));

                const mappedLines: RFQLineValues[] = sourceLines.map((line: RFQLine, i: number) => ({
                    line_no: i + 1,
                    item_code: line.item_code,
                    item_name: line.item_name,
                    description: line.description || '',
                    qty: line.qty,
                    uom: line.uom,
                    uom_id: line.uom_id || 0,
                    required_receipt_type: 'FULL',
                    target_delivery_date: line.target_delivery_date?.split('T')[0] || '',
                    note_to_vendor: line.note_to_vendor || '',
                    item_id: line.item_id || undefined,
                    pr_line_id: line.pr_line_id || undefined,
                }));

                // Fetch PR detail if pr_id exists but pr_no is missing from backend response 
                let fetchedPrNo = rfq.pr?.pr_no || rfq.ref_pr_no || rfq.pr_no || null;
                if (rfq.pr_id && !fetchedPrNo) {
                    try {
                        const prData = await PRService.getDetail(rfq.pr_id);
                        if (prData && prData.pr_no) {
                            fetchedPrNo = prData.pr_no;
                        }
                    } catch (e) {
                        logger.warn('Failed to fetch PR details for mapping pr_no:', e);
                    }
                }

                reset({
                    ...getRFQDefaultFormValues(),
                    rfq_no: rfq.rfq_no,
                    rfq_date: rfq.rfq_date?.split('T')[0] || new Date().toLocaleDateString('en-CA'),
                    pr_id: rfq.pr_id || null,
                    pr_no: fetchedPrNo,
                    branch_id: rfq.branch_id ? Number(rfq.branch_id) : 0,
                    status: (rfq.status as RFQStatus) || 'DRAFT',
                    quotation_due_date: rfq.quotation_due_date?.split('T')[0] || '',
                    rfq_base_currency_code: rfq.rfq_base_currency_code || 'THB',
                    rfq_quote_currency_code: rfq.rfq_quote_currency_code || 'THB',
                    rfq_exchange_rate: rfq.rfq_exchange_rate || 1,
                    rfq_exchange_rate_date: rfq.rfq_exchange_rate_date?.split('T')[0] || '',
                    payment_term_hint: rfq.payment_term_hint || '',
                    incoterm: rfq.incoterm || '',
                    remarks: rfq.remarks || '',
                    purpose: rfq.purpose || '',
                    receive_location: rfq.receive_location || '',
                    isMulticurrency: (rfq.rfq_base_currency_code || 'THB') !== 'THB',
                    rfqLines: mappedLines,
                    vendors: mappedVendors,
                });

            } catch (error) {
                logger.error('Failed to fetch RFQ for edit:', error);
                toast('ไม่สามารถดึงข้อมูล RFQ ได้', 'error');
            } finally {
                setIsLoadingEdit(false);
            }
        };
        fetchRFQDetails();
    }, [isOpen, editId, reset, toast]);

    // ========================================================================
    // BRANCH 2: Create from PR Auto-Hydration
    // ========================================================================
    useEffect(() => {
        if (!isOpen || editId) return;

        const hydrateFromPR = async () => {
            const pr_id = initialPR?.pr_id;
            if (!pr_id) {
                reset(getRFQDefaultFormValues());
                return;
            }

            try {
                setIsLoadingEdit(true);
                const fullPR = await PRService.getDetail(pr_id);
                // Pass already-loaded master data for line enrichment
                const mappedData = mapPRToRFQFormData(fullPR, items, units);
                
                // Track original lines for reset feature
                if (mappedData.rfqLines) {
                    setOriginalPRLines(mappedData.rfqLines as RFQLineValues[]);
                }

                // 🛡️ SAFE RESET: Merge with current user-entered data
                const currentValues = getValues();
                reset({
                    ...currentValues,
                    ...mappedData,
                });
                
                toast(`ดึงข้อมูลจาก PR ${fullPR.pr_no} เรียบร้อย`, 'success');
            } catch (error) {
                logger.error('Failed to auto-hydrate RFQ from PR:', error);
                toast('ไม่สามารถดึงข้อมูล PR ได้', 'error');
            } finally {
                setIsLoadingEdit(false);
            }
        };

        hydrateFromPR();
    }, [isOpen, editId, initialPR, items, units, reset, getValues, toast]);

    // ========================================================================
    // MAGIC AUTO-FILL: Manual PR Selection Handler
    // ========================================================================
    const handlePRSelect = useCallback(async (prRecord: PRHeader) => {
        setIsPRSelectionModalOpen(false);
        
        // 🔍 DIAGNOSTIC: Log what the modal passed us
        logger.debug('[handlePRSelect] prRecord received:', {
            pr_id: prRecord.pr_id,
            pr_no: prRecord.pr_no,
            has_lines: !!(prRecord as PRHeader & { lines?: unknown[] }).lines?.length,
        });
        
        if (!prRecord.pr_id) {
            logger.error('[handlePRSelect] prRecord.pr_id is undefined — cannot fetch detail!');
            toast('ข้อมูล PR ไม่ถูกต้อง (ไม่พบ pr_id)', 'error');
            return;
        }
        
        try {
            setIsLoadingEdit(true);
            const fullPR = await PRService.getDetail(prRecord.pr_id);
            
            // 🔍 DIAGNOSTIC: Log the full PR detail response
            logger.debug('[handlePRSelect] fullPR from getDetail:', {
                pr_id: fullPR?.pr_id,
                pr_no: fullPR?.pr_no,
                lines_count: fullPR?.lines?.length ?? 'NO LINES',
                raw_keys: Object.keys(fullPR || {}),
            });
            
            // Pass already-loaded master data for enriching item_code/item_name/uom
            const mappedData = mapPRToRFQFormData(fullPR, items, units);

            // Track original lines for reset feature
            if (mappedData.rfqLines) {
                setOriginalPRLines(mappedData.rfqLines as RFQLineValues[]);
            }

            // 🛡️ SAFE RESET: Don't lose Purpose/Remarks if user typed them
            const currentValues = getValues();
            reset({
                ...currentValues,
                ...mappedData,
            });

            toast(`ดึงรายการสินค้าจาก PR ${fullPR?.pr_no ?? prRecord.pr_no} เรียบร้อย`, 'success');
        } catch (error) {
            logger.error('Failed to load PR details:', error);
            toast('ไม่สามารถโหลดข้อมูล PR ได้', 'error');
        } finally {
            setIsLoadingEdit(false);
        }
    }, [items, units, reset, getValues, toast]);

    const handleResetLines = useCallback(() => {
        if (originalPRLines.length === 0) {
            toast('ไม่มีข้อมูลต้นทาง PR ให้คืนค่า', 'warning');
            return;
        }
        
        // Deep copy to prevent reference mutation
        const resetLines = originalPRLines.map(line => ({ ...line }));
        
        setValue('rfqLines', resetLines);
        toast('คืนค่ารายการสินค้าจาก PR เรียบร้อย', 'success');
    }, [originalPRLines, setValue, toast]);

    // ========================================================================
    // SAVE FLOW (RHF handleSubmit Integration)
    // ========================================================================
    const handleFormSubmit = async (data: RFQFormValues) => {
        setStagedPayload(data);
        setIsConfirmOpen(true);
    };

    const handleInvalid = useCallback(() => {
        // 🔍 DIAGNOSTIC: Log exact validation errors to DevTools console
        const currentErrors = methods.formState.errors;
        console.error('[RFQ Validation] ❌ Zod Errors — field breakdown:', currentErrors);
        console.error('[RFQ Validation] 📋 Current form values:', methods.getValues());
        toast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง (ตรวจสอบฟิลด์สีแดง)', 'error');
    }, [toast, methods]);

    const handleCancelConfirm = useCallback(() => {
        setIsConfirmOpen(false);
        setStagedPayload(null);
    }, []);

    const executeSave = async () => {
        if (!stagedPayload) return;

        setIsSaving(true);
        try {
            const cleanLines: RFQLineDTO[] = stagedPayload.rfqLines
                .filter(line => (line.item_code || line.item_id || line.description) && line.qty > 0)
                .map((line, index) => {
                    const dto: RFQLineDTO = {
                        line_no: index + 1,
                        description: String(line.description || line.item_name || 'No description'),
                        qty: Number(line.qty),
                        uom_id: Number(line.uom_id || 1),
                    };
                    // Optional fields — only add if present
                    if (line.item_id) dto.item_id = Number(line.item_id);
                    if (line.pr_line_id) dto.pr_line_id = Number(line.pr_line_id);
                    if (line.required_receipt_type) dto.required_receipt_type = String(line.required_receipt_type);
                    if (line.target_delivery_date) dto.target_delivery_date = String(line.target_delivery_date);
                    if (line.note_to_vendor) dto.note_to_vendor = String(line.note_to_vendor);
                    return dto;
                });

            // 🎯 THE DOUBLE REQUESTER STRIKE: Backend demands BOTH fields simultaneously.
            const resolvedRequestedByUserId = Number(stagedPayload.requested_by_user_id || 1);
            const resolvedRequestedByName = String(stagedPayload.requested_by || 'System User');

            // ⚠️ BACKEND WHITELIST: Only send fields the API accepts.
            // `purpose` and `project_id` are rejected by the backend controller.
            const payload: RFQCreateDTO = {
                rfq_date: stagedPayload.rfq_date,
                requested_by_user_id: resolvedRequestedByUserId,
                requested_by: resolvedRequestedByName,
                status: stagedPayload.status,
                quotation_due_date: stagedPayload.quotation_due_date,
                branch_id: Number(stagedPayload.branch_id),
                rfq_base_currency_code: stagedPayload.rfq_base_currency_code,
                rfq_quote_currency_code: stagedPayload.rfq_quote_currency_code || 'THB',
                rfq_exchange_rate: Number(stagedPayload.rfq_exchange_rate || 1),
                rfq_exchange_rate_date: stagedPayload.rfq_exchange_rate_date || stagedPayload.rfq_date,
                remarks: stagedPayload.remarks || '',
                receive_location: stagedPayload.receive_location,
                payment_term_hint: stagedPayload.payment_term_hint,
                incoterm: stagedPayload.incoterm,
                // ❌ purpose     — backend rejects this field
                // ❌ project_id  — backend rejects this field

                // Inherited PR Fields (Transactional Traceability)
                pr_id: stagedPayload.pr_id ? Number(stagedPayload.pr_id) : undefined,
                cost_center_id: stagedPayload.cost_center_id ? Number(stagedPayload.cost_center_id) : undefined,

                rfqLines: cleanLines,
            };

            const selectedVendors = Array.from(
                new Map(
                    stagedPayload.vendors
                        .filter(v => v.vendor_id)
                        .map(v => [Number(v.vendor_id), { vendor_id: Number(v.vendor_id), status: 'WAITING' }])
                ).values()
            );
                
            if (selectedVendors.length > 0) {
                payload.rfqVendors = selectedVendors;
            }

            // 🕵️‍♂️ @Agent_Source_Auditor: Verify pr_id Persistence
            logger.debug('[useRFQForm] RFQ Payload Audit:', {
                pr_id: payload.pr_id,
                has_pr_id: !!payload.pr_id,
                rfq_no_placeholder: payload.rfq_date // tracing timestamp
            });

            if (editId) {
                await RFQService.update(editId, payload);
                toast('บันทึกการแก้ไข RFQ สำเร็จ', 'success');
            } else {
                await RFQService.create(payload);
                toast('สร้าง RFQ สำเร็จ', 'success');
            }

            if (onSuccess) await onSuccess();
            onClose();
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก RFQ';
            toast(errMsg, 'error');
        } finally {
            setIsSaving(false);
            setIsConfirmOpen(false);
            setStagedPayload(null);
        }
    };

    // ========================================================================
    // VENDOR ACTIONS
    // ========================================================================
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [activeVendorIndex, setActiveVendorIndex] = useState<number | null>(null);

    const handleAddVendor = useCallback(() => {
        setActiveVendorIndex(null);
        setIsVendorModalOpen(true);
    }, []);

    const handleRemoveVendor = useCallback((index: number) => {
        removeVendor(index);
    }, [removeVendor]);

    const handleOpenVendorModal = (index: number) => {
        setActiveVendorIndex(index);
        setIsVendorModalOpen(true);
    };

    const handleVendorSelect = (vendor: VendorSearchItem) => {
        const currentVendors = getValues('vendors');
        const alreadyExists = currentVendors.some(v => v.vendor_id === vendor.vendor_id);
        
        if (alreadyExists) {
            toast('ผู้ขายรายนี้อยู่ในรายการแล้ว', 'warning');
            return;
        }

        const newEntry = {
            vendor_id: vendor.vendor_id,
            vendor_code: vendor.code,
            vendor_name: vendor.name,
            vendor_name_display: `${vendor.code} - ${vendor.name}`,
        };

        if (activeVendorIndex !== null) {
            setValue(`vendors.${activeVendorIndex}`, newEntry);
        } else {
            appendVendor(newEntry);
        }
        setIsVendorModalOpen(false);
    };

    return {
        // Methods & State
        methods,
        isLoadingEdit,
        isSaving,
        activeTab,
        setActiveTab,
        branches,
        items,
        units,
        trackingVendors,
        errors,
        
        // Confirmation Logic
        isConfirmOpen,
        handleCancelConfirm,
        executeSave,
        onRequestSave: handleSubmit(handleFormSubmit, handleInvalid),

        // PR Selection
        isPRSelectionModalOpen,
        setIsPRSelectionModalOpen,
        handlePRSelect,

        // Modal Controls
        isVendorModalOpen,
        setIsVendorModalOpen,
        handleAddVendor,
        handleRemoveVendor,
        handleOpenVendorModal,
        handleVendorSelect,

        // Field Handlers
        appendLine: () => appendLine(createEmptyRFQLine(lineFields.length + 1)),
        removeLine,
        handleResetLines,
    };
};