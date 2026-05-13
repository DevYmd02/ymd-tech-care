import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, type FieldErrors, type FieldError } from 'react-hook-form';
import { useAuth } from '@/core/auth/contexts/AuthContext';

import { zodResolver } from '@hookform/resolvers/zod';
import { MasterDataService } from '@/modules/master-data';
import type { BranchListItem, ItemListItem, UnitListItem, Currency } from '@/modules/master-data/types/master-data-types';
import type { VendorSearchItem, VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';
import type { RFQVendor, RFQLine, RFQDetailResponse, RFQStatus } from '@/modules/procurement/types/rfq-types';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { PRHeader } from '@/modules/procurement/types';
import type { Resolver } from 'react-hook-form';
import { PRService } from '@/modules/procurement/services/pr.service';
import { RFQService, type RFQCreateDTO, type RFQLineDTO } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useQuery } from '@tanstack/react-query';
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
    vendorDetail?: VendorMaster | null
): Partial<RFQFormValues> => {
    return {
        pr_id: pr.pr_id,
        pr_no: pr.pr_no,
        approved_pr_no: pr.approved_pr_no || pr.av_no || pr.approval_no || null,
        branch_id: pr.branch_id,
        project_id: pr.project_id || null,
        purpose: pr.purpose || '',
        // cost_center_id: pr.cost_center_id ? Number(pr.cost_center_id) : undefined,
        pr_tax_code_id: pr.pr_tax_code_id || undefined,
        pr_tax_rate: pr.pr_tax_rate || undefined,
        
        // Currency Sync
        isMulticurrency: true,
        rfq_base_currency_code: pr.pr_base_currency_code,
        rfq_quote_currency_code: pr.pr_quote_currency_code || 'THB',
        rfq_exchange_rate: pr.pr_exchange_rate || 1,
        rfq_exchange_rate_date: pr.pr_exchange_rate_date ? pr.pr_exchange_rate_date.split('T')[0] : '',
        
        // Remark Append Style
        remarks: pr.remark 
            ? `${pr.remark}\n[PR: ${pr.pr_no}]` 
            : `Generated from PR: ${pr.pr_no}`,

        target_delivery_date: (pr.delivery_date || pr.deliveryDate || pr.need_by_date || '').toString().split('T')[0] || '',

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
                    line.delivery_date ||
                    line.needed_date ||
                    line.line_needed_date ||
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
            vendor_code: vendorDetail?.vendor_code || pr.vendor_code || '',
            vendor_name: vendorDetail?.vendor_name || pr.vendor_name || '',
            vendor_name_display: (vendorDetail?.vendor_code || pr.vendor_code) 
                ? `${vendorDetail?.vendor_code || pr.vendor_code} - ${vendorDetail?.vendor_name || pr.vendor_name || ''}`
                : (vendorDetail?.vendor_name || pr.vendor_name || '(Preferred Vendor from PR)'),
        }] : [],
    };
};

export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void, editId?: number | null, readOnly: boolean = false) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [stagedPayload, setStagedPayload] = useState<RFQFormValues | null>(null);

    // Track original PR lines for potential reset feature
    const [activePR, setActivePR] = useState<PRHeader | null>(initialPR || null);
    const [originalPRLines, setOriginalPRLines] = useState<RFQLineValues[]>([]);
    const hasInitialHydrated = React.useRef(false);

    // Vendor Tracking (for View Mode Only)
    const [trackingVendors, setTrackingVendors] = useState<Array<RFQVendor & { vendor_code?: string; vendor_name?: string }>>([]);
    const [rfq, setRfq] = useState<RFQDetailResponse | null>(null);
    const [rawRfqData, setRawRfqData] = useState<RFQDetailResponse | null>(null);

    // 🏗️ React Hook Form Setup
    const methods = useForm<RFQFormValues>({
        resolver: zodResolver(RFQFormSchema) as Resolver<RFQFormValues>,
        defaultValues: {
            ...getRFQDefaultFormValues(),
            requested_by: user?.employee?.employee_fullname || '',
            requested_by_user_id: user?.id || undefined,
        },
        mode: 'onBlur',
    });

    const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isDirty } } = methods;

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !readOnly,
        onSafeClose: onClose
    });

    const { fields: lineFields, append: appendLine, remove: removeLine } = useFieldArray({
        control,
        name: 'rfqLines',
    });

    const { fields: vendorFields, append: appendVendor, remove: removeVendor, update: updateVendor } = useFieldArray({
        control,
        name: 'vendors',
    });

    // Master Data State
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [units, setUnits] = useState<UnitListItem[]>([]);

    const { data: currencies } = useQuery({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
    });


    // Exchange Rate Sync logic
    const sourceCurrency = methods.watch('rfq_base_currency_code');
    const targetCurrency = methods.watch('rfq_quote_currency_code');

    useEffect(() => {
        if (!sourceCurrency) return;
        
        if (sourceCurrency === 'THB' || sourceCurrency === targetCurrency) {
            setValue('rfq_exchange_rate', 1, { shouldDirty: false });
            return;
        }

        const sourceObj = currencies?.find((c: Currency) => c.currency_code === sourceCurrency);
        const targetObj = currencies?.find((c: Currency) => c.currency_code === targetCurrency);

        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || (targetCurrency === 'THB' ? 1 : 1);

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('rfq_exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue]);



    // PR Selection State
    const [isPRSelectionModalOpen, setIsPRSelectionModalOpen] = useState(false);
    const [isApprovedPRModalOpen, setIsApprovedPRModalOpen] = useState(false);

    const handleApprovedPRSelect = useCallback((record: unknown) => {
        const rec = record as Record<string, unknown>;
        const approvedNo = String(rec.approval_no || rec.approved_pr_no || rec.approval_id || '');
        setValue('approved_pr_no', approvedNo || null, { shouldValidate: true, shouldDirty: true });
        setValue('pr_approval_id', rec.approval_id ? Number(rec.approval_id) : undefined, { shouldDirty: true });
        
        // 🆕 Extract AV approved delivery date with deep scanning — prioritizing PR's requested date
        // We favor the original PR date or need_by_date, as AV's 'delivery_date' often defaults to system dates in the backend
        const rawDate = activePR?.delivery_date || 
                        initialPR?.delivery_date || 
                        (rec as unknown as PRHeader).need_by_date || 
                        rec.needByDate || 
                        (rec as unknown as PRHeader).delivery_date || 
                        (rec as unknown as PRHeader).deliveryDate || 
                        rec.due_date || 
                        (rec.pr as Record<string, unknown>)?.delivery_date || 
                        (rec.pr as Record<string, unknown>)?.need_by_date || '';
        const finalAVDate = rawDate ? rawDate.toString().split('T')[0] : '';
        
        logger.info("💎 [DIAGNOSTIC] AV Selection Date Extraction (Adjusted Precedence):", {
            record_id: rec.approval_id,
            rawDate,
            finalAVDate,
            activePR_date: activePR?.delivery_date,
            all_keys: Object.keys(rec)
        });

        // 🎯 Header Level Update
        if (finalAVDate) {
            setValue('target_delivery_date', finalAVDate, { shouldDirty: true });
        }
        
        // 🔄 SYNC LINES: If AV record has lines, override form lines
        const avLines = (rec.prApprovalLines || rec.lines || rec.pr_approval_lines || []) as unknown[];
        
        if (avLines && Array.isArray(avLines) && avLines.length > 0) {
            logger.info("💎 [DIAGNOSTIC] AV Record sync lines start:", { count: avLines.length });

            // Get original PR lines to preserve item details
            const currentPrLines = originalPRLines || [];

            const matchedLines: RFQLineValues[] = (avLines as unknown as Record<string, unknown>[]).map((avLine, index) => {
                // 🛡️ DISAMBIGUATION: Separating source PR Line ID from this Approval Line's own ID
                const prLineId = avLine.pr_line_id || avLine.item_id || 0; 
                const avLineId = Number(avLine.id || avLine.approval_line_id || avLine.pr_approval_line_id || 0);

                // Use loose equality or Number conversion to be safe
                const originalLine = currentPrLines.find(l => Number(l.pr_line_id) === Number(prLineId) || Number(l.item_id) === Number(avLine.item_id));
                
                // 💧 MASTER DATA FALLBACK: If both sources lack names, try master list
                const masterItem = items.find(it => Number(it.item_id) === Number(avLine.item_id));

                const avLineRec = avLine as Record<string, unknown>;
                const qty = Number(avLineRec.approved_qty || avLineRec.qty || 0);
                const estUnitPrice = Number(originalLine?.est_unit_price || avLineRec.est_unit_price || 0);
                
                return {
                    line_no: index + 1,
                    item_code: originalLine?.item_code || (avLineRec.item_code as string) || masterItem?.item_code || '',
                    item_name: originalLine?.item_name || (avLineRec.item_name as string) || (avLineRec.description as string) || masterItem?.item_name || '',
                    description: originalLine?.description || (avLineRec.description as string) || masterItem?.item_name || '',
                    qty: qty, // 🎯 This is the new quantity from AV
                    uom: originalLine?.uom || (avLineRec.uom as string) || masterItem?.unit_name || '',
                    uom_id: originalLine?.uom_id || (avLineRec.uom_id as number) || 0,
                    required_receipt_type: originalLine?.required_receipt_type || 'FULL',
                    // 🎯 IMPROVED: Prefer Original Line (PR) date if AV line date is ambiguous
                    target_delivery_date: (
                        originalLine?.target_delivery_date || 
                        avLineRec.delivery_date || 
                        avLineRec.line_needed_date || 
                        avLineRec.need_by_date || 
                        finalAVDate || 
                        ''
                    ).toString().split('T')[0] || '', 
                    note_to_vendor: originalLine?.note_to_vendor || '',
                    item_id: originalLine?.item_id || (avLineRec.item_id as number) || masterItem?.item_id,
                    pr_line_id: prLineId ? Number(prLineId) : undefined,
                    // 🔗 Record ID of the PR Approval Line (CRITICAL FOR BACKEND)
                    approval_line_id: avLineId > 0 ? avLineId : undefined,
                    est_unit_price: estUnitPrice,
                    est_amount: qty * estUnitPrice
                };
            });
            
            logger.debug(`🐞 [DEBUG] Matched ${matchedLines.length} lines for RFQ`, matchedLines);
            
            // 🎯 Update using setValue for better reactivity across components
            setValue('rfqLines', matchedLines, { shouldDirty: true, shouldValidate: true });
            toast(`ปรับปรุงรายการสินค้าตามใบอนุมัติ ${approvedNo} เรียบร้อย`, 'success');
        }
        
        setIsApprovedPRModalOpen(false);
    }, [setValue, originalPRLines, toast, items, initialPR, activePR]);

    // --- 🔗 [NEW] AV Hydration logic: Fetch Approval No if missing but PR reference exists ---
    const currentPrId = methods.watch('pr_id');
    const currentPrNo = methods.watch('pr_no');
    const currentApprovedPrNo = methods.watch('approved_pr_no');
    
    const { data: approvalHydrationData } = useQuery({
        queryKey: ['rfq-av-hydration', currentPrId],
        queryFn: async () => {
            if (!currentPrId) return null;
            // Use getPRApprovalDetail to get the exact same data (including lines) as the modal
            const res = await RFQService.getPRApprovalDetail(Number(currentPrId));
            return res || [];
        },
        enabled: isOpen && !!(currentPrId && !currentApprovedPrNo),
        staleTime: 5 * 60 * 1000,
    });

    const lastSyncedAVNo = React.useRef<string | null>(null);

    useEffect(() => {
        // 🛡️ STOP: Manual Select Only for New RFQs if there's no Edit Mode ID
        // This gives the user control to select which AV they want (if multiple exist)
        if (!editId) return;

        // 🛡️ STOP: Don't auto-sync if we're in Edit Mode and already hydrated 
        if (editId && hasInitialHydrated.current) return;

        if (!isOpen || !currentPrNo || !approvalHydrationData || approvalHydrationData.length === 0) return;

        // Find the AV we want to sync (either the specific one chosen in PR, or the first one)
        const targetAV = currentApprovedPrNo 
            ? approvalHydrationData.find(av => (av.approval_no || av.approved_pr_no || av.approval_id?.toString()) === currentApprovedPrNo)
            : approvalHydrationData[0];

        if (targetAV) {
            const avNo = targetAV.approval_no || targetAV.approved_pr_no || targetAV.approval_id?.toString();
            
            // 🎯 Only sync if this AV hasn't been synced for the current PR to avoid infinite loops
            if (avNo && lastSyncedAVNo.current !== `${currentPrNo}_${avNo}`) {
                logger.info(`[useRFQForm] Syncing AV details for PR ${currentPrNo}: ${avNo}`);
                handleApprovedPRSelect(targetAV);
                lastSyncedAVNo.current = `${currentPrNo}_${avNo}`;
            }
        }
    }, [isOpen, currentPrNo, currentApprovedPrNo, approvalHydrationData, handleApprovedPRSelect, editId]);

    // --- 🔗 [FORCE] Auto-Fetch AV Number for Existing RFQs (Consistency with RFQListPage) ---
    useEffect(() => {
        const fetchMissingAVNo = async () => {
            const prApprovalId = methods.getValues('pr_approval_id');
            const currentPrId = methods.getValues('pr_id');

            // Trigger: Only if open, in Edit Mode, has PR ID but no AV No displayed
            if (!isOpen || !editId || !currentPrId || currentApprovedPrNo) return;

            try {
                logger.info(`🔍 [useRFQForm] Restoring missing AV number for RFQ ${editId} (PR ID: ${currentPrId})`);
                const records = await RFQService.getPRApprovalDetail(Number(currentPrId));
                
                if (records && records.length > 0) {
                    // Match by pr_approval_id if available, otherwise fallback to first (historical)
                    const match = prApprovalId 
                        ? records.find((r) => Number(r.approval_id) === Number(prApprovalId))
                        : records[0];

                    if (match) {
                        const foundNo = String(match.approval_no || match.approved_pr_no || '');
                        logger.info(`✅ [useRFQForm] Restored AV No: ${foundNo}`);
                        setValue('approved_pr_no', foundNo, { shouldValidate: true, shouldDirty: false });
                    }
                }
            } catch (err) {
                logger.warn(`⚠️ [useRFQForm] Could not restore AV number:`, err);
            }
        };

        fetchMissingAVNo();
    }, [isOpen, editId, currentPrNo, currentApprovedPrNo, setValue, methods]);

    // 🔄 AUTO-SYNC: Header Delivery Date -> All Lines
    const headerDeliveryDate = methods.watch('target_delivery_date');
    useEffect(() => {
        // Only sync if hydration is complete and we have a valid date
        if (!hasInitialHydrated.current || !headerDeliveryDate) return;

        const currentLines = getValues('rfqLines') || [];
        if (currentLines.length === 0) return;

        // Check if any line actually needs updating to prevent redundant setValue calls
        const needsUpdate = currentLines.some(line => line.target_delivery_date !== headerDeliveryDate);
        
        if (needsUpdate) {
            const updatedLines = currentLines.map(line => ({
                ...line,
                target_delivery_date: headerDeliveryDate
            }));
            
            logger.debug(`[useRFQForm] Auto-syncing ${updatedLines.length} lines to header date: ${headerDeliveryDate}`);
            setValue('rfqLines', updatedLines, { shouldDirty: true, shouldValidate: true });
        }
    }, [headerDeliveryDate, setValue, getValues]);

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
    // ========================================================================
    // BRANCH 1: Edit Existing RFQ - Fetch and Rescue Phase
    // ========================================================================
    useEffect(() => {
        if (!isOpen || !editId) {
            setRawRfqData(null);
            setRfq(null);
            hasInitialHydrated.current = false;
            return;
        }

        const fetchRFQDetails = async () => {
            setIsLoadingEdit(true);
            try {
                const rfqId = Number(editId);
                const rfqRes = await RFQService.getById(rfqId) as RFQDetailResponse;
                if (!rfqRes) return;

                // 🎯 BRANCH A: Extract Initial Lines from RFQ
                let sourceLines: RFQLine[] = (rfqRes.rfqLines && rfqRes.rfqLines.length > 0) 
                    ? rfqRes.rfqLines 
                    : (rfqRes.lines && rfqRes.lines.length > 0)
                        ? rfqRes.lines
                        : (rfqRes as unknown as Record<string, unknown>).rfq_lines as RFQLine[] || (rfqRes as unknown as Record<string, unknown>).rfq_line as RFQLine[] || (rfqRes as unknown as Record<string, unknown>).items as RFQLine[] || (rfqRes as unknown as Record<string, unknown>).rfq_items as RFQLine[] || [];

                // 🚀 AGGRESSIVE RESCUE: Check if lines from backend are "Broken" (No ID, No Code)
                const isBroken = sourceLines.length > 0 && sourceLines.every((l) => !l.item_id && !l.item_code);
                
                if ((sourceLines.length === 0 || isBroken) && rfqRes.pr_id) {
                    logger.warn(`🛟 [useRFQForm] RFQ ${editId} has ${isBroken ? 'BROKEN' : 'NO'} lines. Forcing Rescue from PR: ${rfqRes.pr_id}`);
                    try {
                        const prData = await PRService.getDetail(Number(rfqRes.pr_id));
                        const rescuedLines = prData?.lines || (prData as unknown as Record<string, unknown>)?.pr_lines as RFQLine[] || (prData as unknown as Record<string, unknown>)?.items as RFQLine[] || [];
                        if (rescuedLines.length > 0) {
                            sourceLines = rescuedLines as RFQLine[];
                            logger.info(`✅ [useRFQForm] Successfully rescued ${sourceLines.length} lines from PR.`);
                        }
                    } catch (e) {
                         logger.error('💥 [useRFQForm] Aggressive rescue failed:', e);
                    }
                }

                // Inject the fixed lines back into the object for the hydration effect
                rfqRes.rfqLines = sourceLines;
                
                setRawRfqData(rfqRes);
                setRfq(rfqRes); 
            } catch (error) {
                logger.error('Failed to fetch RFQ for edit:', error);
                toast('ไม่สามารถดึงข้อมูล RFQ ได้', 'error');
            } finally {
                setIsLoadingEdit(false);
            }
        };

        fetchRFQDetails();
    }, [isOpen, editId, toast]);

    // ========================================================================
    // 💧 HYDRATION ENGINE: Reactive Mapping when Raw Data + Master Data ready
    // ========================================================================
    useEffect(() => {
        if (!isOpen || !rawRfqData || items.length === 0 || hasInitialHydrated.current) return;

        const hydrateForm = async () => {
            try {
                // Safeguard against double resets causing flickering
                hasInitialHydrated.current = true;
                
                const rfq = rawRfqData;
                const sourceLines = rfq.rfqLines || [];
                
                // Hydrate vendor details if missing from backend
                const vendorMap = new Map<number, Record<string, unknown>>();
                (rfq.vendors || []).forEach(v => {
                    if (v.vendor_id) vendorMap.set(Number(v.vendor_id), v as unknown as Record<string, unknown>);
                });
                (rfq.rfqVendors || []).forEach(v => {
                    const vendorId = Number(v.vendor_id);
                    const existing = vendorMap.get(vendorId) || {};
                    vendorMap.set(vendorId, { ...existing, ...v });
                });

                const enhancedVendors = (await Promise.all(Array.from(vendorMap.values()).map(async (v) => {
                    const isSent = v.status === 'SENT' || v.status === 'RESPONDED';
                    const hasEmail = Boolean(v.email_sent_to || v.email);
                    if (v.vendor_name && v.vendor_code && (isSent ? hasEmail : true)) return v as unknown as RFQVendor & { vendor_code?: string; vendor_name?: string };
                    
                    try {
                        const vendorDetail = await VendorService.getById(v.vendor_id as number);
                        if (vendorDetail) {
                            return {
                                ...v,
                                vendor_name: vendorDetail.vendor_name || v.vendor_name || '',
                                vendor_code: vendorDetail.vendor_code || v.vendor_code || '',
                                email_sent_to: v.email_sent_to || vendorDetail.email || null,
                            } as RFQVendor & { vendor_code?: string; vendor_name?: string };
                        }
                    } catch {
                         logger.warn('Failed to fetch vendor detail for id', v.vendor_id);
                    }
                    return v as unknown as RFQVendor & { vendor_code?: string; vendor_name?: string };
                }))) as Array<RFQVendor & { vendor_code?: string; vendor_name?: string }>;

                setTrackingVendors(enhancedVendors);

                const mappedVendors: RFQVendorValues[] = enhancedVendors.map((v) => ({
                    vendor_id: v.vendor_id as number,
                    vendor_code: v.vendor_code || '',
                    vendor_name: v.vendor_name || '',
                    vendor_name_display: v.vendor_code ? `${v.vendor_code} - ${v.vendor_name}` : v.vendor_name || '',
                    status: v.status as string,
                    is_existing: true,
                }));

                const mappedLines: RFQLineValues[] = sourceLines.map((line: RFQLine, i: number) => {
                    const item_id = line.item_id ? Number(line.item_id) : undefined;
                    const uom_id = Number(line.uom_id) || 0;

                    // 🎯 Master Data Lookup
                    const masterItem = items.find(it => Number(it.item_id) === item_id || it.id === item_id);
                    const masterUnit = units.find(u => Number(u.unit_id) === uom_id || u.id === uom_id);

                    const item_code = line.item_code || line.itemCode || line.product_code || 
                                     (line.item as Record<string, unknown>)?.item_code as string || (line.product as Record<string, unknown>)?.product_code as string || 
                                     masterItem?.item_code || '';
                    
                    const item_name = line.item_name || line.itemName || line.product_name || 
                                     (line.item as Record<string, unknown>)?.item_name as string || (line.product as Record<string, unknown>)?.product_name as string || 
                                     masterItem?.item_name || '';
                    
                    const uom       = line.uom || masterUnit?.unit_name || (masterItem as unknown as Record<string, unknown>)?.unit_name as string || '';

                    return {
                        line_no: i + 1,
                        item_code,
                        item_name,
                        description: line.description || item_name || '',
                        qty: line.qty,
                        uom,
                        uom_id: uom_id,
                        required_receipt_type: line.required_receipt_type || 'FULL',
                        target_delivery_date: line.target_delivery_date?.split('T')[0] || '',
                        note_to_vendor: line.note_to_vendor || '',
                        item_id: item_id,
                        pr_line_id: line.pr_line_id || undefined,
                        approval_line_id: line.approval_line_id || undefined,
                        rfq_line_id: (line as unknown as Record<string, unknown>).rfq_line_id as number || undefined,
                    };
                });

                // 🎯 Memory Sync: Keep original lines for AV sync reference
                setOriginalPRLines(mappedLines);

                // Fetch PR detail for pr_no if missing AND preserve for date fallback
                let fetchedPrNo = rfq.pr?.pr_no || rfq.ref_pr_no || rfq.pr_no || null;
                let fullPRData = null;
                if (rfq.pr_id) {
                    try {
                        fullPRData = await PRService.getDetail(rfq.pr_id);
                        if (fullPRData) {
                            setActivePR(fullPRData);
                            if (fullPRData.pr_no) fetchedPrNo = fullPRData.pr_no;
                        }
                    } catch (e) {
                         logger.warn('Failed sync PR details:', e);
                    }
                }

                const creatorName = rfq.requested_by_user 
                    ? `${rfq.requested_by_user.employee_firstname_th} ${rfq.requested_by_user.employee_lastname_th}`
                    : (rfq.requested_by || '');

                reset({
                    ...getRFQDefaultFormValues(),
                    rfq_no: rfq.rfq_no,
                    requested_by: creatorName,
                    requested_by_user_id: (rfq.requested_by_user as unknown as Record<string, unknown>)?.employee_id as number || rfq.created_by_user_id || undefined,
                    rfq_date: rfq.rfq_date?.split('T')[0] || new Date().toLocaleDateString('en-CA'),
                    pr_id: rfq.pr_id || null,
                    pr_no: fetchedPrNo,
                    pr_approval_id: rfq.pr_approval_id || (rfq as unknown as Record<string, unknown>).approval_id as number || null,
                    approved_pr_no: rfq.approved_pr_no || (rfq as unknown as Record<string, unknown>).approval_no as string || (rfq as unknown as Record<string, unknown>).av_no as string || null,
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
                    isMulticurrency: true, // Force visible for Detail/Edit as requested
                    // 🎯 SMART DERIVATION v2: Force priority to Line Dates (since Header date is not updateable via API)
                    // 🔒 FIX: If Header shows 23 but PR shows 21, prioritize PR's delivery_date
                    target_delivery_date: (
                        fullPRData?.delivery_date || 
                        mappedLines[0]?.target_delivery_date || 
                        rfq.target_delivery_date || 
                        ''
                    ).split('T')[0] || '',
                    rfqLines: mappedLines,
                    vendors: mappedVendors,
                });

                setActiveTab('detail');
            } catch (error) {
                logger.error('Hydration Engine failed:', error);
            }
        };

        hydrateForm();
    }, [isOpen, rawRfqData, items, units, reset]);

    // ========================================================================
    // BRANCH 2: Create from PR Auto-Hydration
    // ========================================================================
    useEffect(() => {
        if (!isOpen || editId) return;

        const hydrateFromPR = async () => {
            const pr_id = initialPR?.pr_id;
            if (!pr_id) {
                reset({
                    ...getRFQDefaultFormValues(),
                    requested_by: user?.employee?.employee_fullname || '',
                    requested_by_user_id: user?.id || 1,
                });
                return;
            }

            try {
                setIsLoadingEdit(true);
                const fullPR = await PRService.getDetail(pr_id);
                
                // 🆕 Hydrate Preferred Vendor
                let vendorDetail: VendorMaster | null = null;
                if (fullPR.preferred_vendor_id) {
                    try {
                        vendorDetail = await VendorService.getById(fullPR.preferred_vendor_id);
                    } catch (e) {
                        logger.warn('Failed to hydrate preferred vendor from PR:', e);
                    }
                }

                // Pass already-loaded master data for line enrichment
                const mappedData = mapPRToRFQFormData(fullPR, items, units, vendorDetail);
                
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
    }, [isOpen, editId, initialPR, items, units, reset, getValues, toast, user]);



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
            
            // 🆕 Hydrate Preferred Vendor
            let vendorDetail: VendorMaster | null = null;
            if (fullPR.preferred_vendor_id) {
                try {
                    vendorDetail = await VendorService.getById(fullPR.preferred_vendor_id);
                } catch (e) {
                    logger.warn('Failed to hydrate preferred vendor on PR selection:', e);
                }
            }
            
            // 🔍 DIAGNOSTIC: Log the full PR detail response
            logger.debug('[handlePRSelect] fullPR from getDetail:', {
                pr_id: fullPR?.pr_id,
                pr_no: fullPR?.pr_no,
                lines_count: fullPR?.lines?.length ?? 'NO LINES',
                raw_keys: Object.keys(fullPR || {}),
                vendor_id: fullPR?.preferred_vendor_id,
                has_vendor_detail: !!vendorDetail
            });
            
            // Pass already-loaded master data for enriching item_code/item_name/uom
            const mappedData = mapPRToRFQFormData(fullPR, items, units, vendorDetail);

            // Track original lines for reset feature
            if (mappedData.rfqLines) {
                setOriginalPRLines(mappedData.rfqLines as RFQLineValues[]);
            }

            // 🛡️ SAFE RESET: Don't lose Purpose/Remarks if user typed them
            const currentValues = getValues();
            setActivePR(fullPR); // 🎯 CRITICAL: Sync activePR state for date inheritance
            reset({
                ...currentValues,
                ...mappedData,
            });
            
            // 🎯 Ensure approved_pr_no is cleared on source change to prevent stale data
            setValue('approved_pr_no', null);

            toast(`ดึงรายการสินค้าจาก PR ${fullPR?.pr_no ?? prRecord.pr_no} เรียบร้อย`, 'success');
        } catch (error) {
            logger.error('Failed to load PR details:', error);
            toast('ไม่สามารถโหลดข้อมูล PR ได้', 'error');
        } finally {
            setIsLoadingEdit(false);
        }
    }, [items, units, reset, getValues, toast, setValue]);

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

    const handleInvalid = useCallback((currentErrors: FieldErrors<RFQFormValues>) => {
        // Auto-scroll to first error (Blueprint Standard)
        const errorKeys = Object.keys(currentErrors);
        if (errorKeys.length > 0) {
            let firstErrorField = document.getElementById(errorKeys[0]);
            if (!firstErrorField) {
                firstErrorField = document.querySelector('.border-red-500');
            }
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (firstErrorField instanceof HTMLInputElement || firstErrorField instanceof HTMLSelectElement || firstErrorField instanceof HTMLTextAreaElement) {
                    try { firstErrorField.focus(); } catch { /* ignore */ }
                }
            }
        }
        // Helper สำหรับดึง message จาก Object ลึกๆ
        const extractErrorMessages = (errors: FieldErrors<RFQFormValues>): string[] => {
            let messages: string[] = [];
            Object.values(errors).forEach((error) => {
                if (!error) return;
                
                const fieldError = error as FieldError;
                if (fieldError.message && typeof fieldError.message === 'string') {
                    // 🛡️ ระบบกรองคำภาษาอังกฤษที่อาจหลุดมา
                    let msg = fieldError.message;
                    const lowerMsg = msg.toLowerCase();
                    if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('received nan')) {
                        msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
                    }
                    messages.push(msg);
                } else if (typeof error === 'object') {
                    messages = messages.concat(extractErrorMessages(error as FieldErrors<RFQFormValues>));
                }
            });
            return Array.from(new Set(messages));
        };

        const errorMessages = extractErrorMessages(currentErrors);

        if (errorMessages.length > 0) {
            const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1' },
                React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
                React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
                    errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
                )
            );
            toast(React.createElement(ErrorToastUI), 'error');
        // } else {
        //     toast('กรุณาตรวจสอบข้อมูลที่ไฮไลท์สีแดงให้ครบถ้วน', 'error');
        }
    }, [toast]);

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
                    // 💧 Preserve ID for edit updates to prevent duplicating lines
                    if ((line as unknown as Record<string, unknown>).rfq_line_id) {
                        dto.rfq_line_id = Number((line as unknown as Record<string, unknown>).rfq_line_id);
                    }
                    // Optional fields — only add if present
                    if (line.item_id) dto.item_id = Number(line.item_id);
                    if (line.pr_line_id) dto.pr_line_id = Number(line.pr_line_id);
                    // 🔗 Send AV Line ID if it's a valid positive number
                    if (line.approval_line_id && Number(line.approval_line_id) > 0) {
                        dto.approval_line_id = Number(line.approval_line_id);
                    }
                    if (line.required_receipt_type) dto.required_receipt_type = String(line.required_receipt_type);
                    if (line.target_delivery_date) dto.target_delivery_date = String(line.target_delivery_date);
                    if (line.note_to_vendor) dto.note_to_vendor = String(line.note_to_vendor);
                    return dto;
                });

            // 🎯 THE DOUBLE REQUESTER STRIKE: Backend demands BOTH fields simultaneously.
            const resolvedRequestedByUserId = editId 
                ? (stagedPayload.requested_by_user_id ? Number(stagedPayload.requested_by_user_id) 
                  : (rfq?.created_by_user_id ? Number(rfq.created_by_user_id) 
                  : ((rfq as unknown as Record<string, unknown>)?.requested_by_user_id ? Number((rfq as unknown as Record<string, unknown>).requested_by_user_id) 
                  : (rfq?.requested_by_user?.employee_id ? Number(rfq.requested_by_user.employee_id) 
                  : (user?.id ? Number(user.id) : undefined))))) // 🚨 Absolute Fallback to satisfy backend
                : (user?.id ? Number(user.id) : undefined);
            const resolvedRequestedByName = editId 
                ? (stagedPayload.requested_by ? String(stagedPayload.requested_by) : (rfq?.created_by_name || (rfq as unknown as Record<string, unknown>)?.requested_by as string || user?.employee?.employee_fullname || undefined))
                : (user?.employee?.employee_fullname ? String(user.employee.employee_fullname) : undefined);

            // 🔍 Debug Audit Log for backend updates
            logger.debug('[executeSave] Requester resolution:', {
                editId,
                resolvedRequestedByUserId,
            });

            // ⚠️ BACKEND WHITELIST: Only send fields the API accepts.
            // `purpose` and `project_id` are rejected by the backend controller.
            const payload: RFQCreateDTO & { approved_pr_no?: string } = {
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
                approved_pr_no: stagedPayload.approved_pr_no || undefined,
                // 🔗 Send AV Header ID (Linkage persistence)
                pr_approval_id: stagedPayload.pr_approval_id 
                    ? Number(stagedPayload.pr_approval_id) 
                    : (rfq?.pr_approval_id ? Number(rfq.pr_approval_id) : undefined), 
                // ❌ purpose     — backend rejects this field
                // ❌ project_id  — backend rejects this field

                // Inherited PR Fields (Transactional Traceability)
                pr_id: stagedPayload.pr_id ? Number(stagedPayload.pr_id) : undefined,
                rfqLines: cleanLines,
            };

            const selectedVendors = Array.from(
                new Map(
                    (stagedPayload.vendors || [])
                        .filter(v => v.vendor_id)
                        .map(v => [Number(v.vendor_id), { 
                            vendor_id: Number(v.vendor_id),
                            status: v.status || 'ACTIVE'
                        }])
                ).values()
            );
                
            // Always set rfqVendors so deletions (including clearing the list) propagate to backend
            payload.rfqVendors = selectedVendors;

            // 🕵️‍♂️ @Agent_Source_Auditor: Verify pr_id Persistence
            logger.debug('[useRFQForm] RFQ Payload Audit:', {
                pr_id: payload.pr_id,
                has_pr_id: !!payload.pr_id,
                rfq_no_placeholder: payload.rfq_date // tracing timestamp
            });

            logger.info("💎 [DIAGNOSTIC] Final RFQ Save Payload:", JSON.stringify(payload, null, 2));

            if (editId) {
                await RFQService.update(editId, payload as unknown as Record<string, unknown>);
                toast('บันทึกการแก้ไข RFQ สำเร็จ', 'success');
            } else {
                await RFQService.create(payload as unknown as Record<string, unknown>);
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

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelVendorIndex, setCancelVendorIndex] = useState<number | null>(null);

    const handleCancelVendor = async (index: number, remark: string) => {
        const vendor = vendorFields[index];
        const trackingItem = trackingVendors?.find(v => v.vendor_id === vendor.vendor_id);
        const rfqVendorId = trackingItem?.rfq_vendor_id;

        if (!rfqVendorId) {
            toast('ไม่พบข้อมูลรหัสผู้ขายในระบบ (rfq_vendor_id)', 'error');
            return false;
        }

        try {
            await RFQService.cancelVendor(rfqVendorId, remark);
            toast('ยกเลิกผู้ขายสำเร็จ', 'success');
            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            toast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด', 'error');
            return false;
        }
    };

    const handleOpenVendorModal = (index: number) => {
        setActiveVendorIndex(index);
        setIsVendorModalOpen(true);
    };

    const handleVendorSelect = (vendor: VendorSearchItem) => {
        const currentVendors = getValues('vendors');
        const alreadyExists = currentVendors.some(v => Number(v.vendor_id || 0) === Number(vendor.vendor_id));
        
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
            updateVendor(activeVendorIndex, newEntry);
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
        currencies: currencies || [],
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
        isApprovedPRModalOpen,
        setIsApprovedPRModalOpen,
        handleApprovedPRSelect,

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

        // Expose vendors fields to prevent useFieldArray overlap sync bugs
        vendors: vendorFields,

        // Cancel Vendor States & Handler
        isCancelModalOpen,
        setIsCancelModalOpen,
        cancelVendorIndex,
        setCancelVendorIndex,
        handleCancelVendor,
        onClose: handleCloseAttempt,
        blocker
    };
};