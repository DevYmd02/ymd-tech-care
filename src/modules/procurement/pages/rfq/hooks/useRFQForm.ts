import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { MasterDataService } from '@/modules/master-data';
import type { BranchListItem, ItemListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { RFQFormData, RFQLineFormData, RFQVendor, RFQVendorFormData, RFQLine } from '@/modules/procurement/types';
import { initialRFQFormData, initialRFQLineFormData } from '@/modules/procurement/types/rfq-types';
import type { PRHeader } from '@/modules/procurement/types';

import { PRService } from '@/modules/procurement/services/pr.service';
import { RFQService, type RFQCreateDTO, type RFQLineDTO } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';



export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void, editId?: string | null) => {
    const [formData, setFormData] = useState<RFQFormData>({
        ...initialRFQFormData,
        rfq_no: 'DRAFT',
        rfq_date: new Date().toLocaleDateString('en-CA'),
        requested_by: 'ระบบจะกรอกอัตโนมัติ',
        rfqLines: [],
    });
    const [originalPRLines, setOriginalPRLines] = useState<RFQLineFormData[]>([]);

    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');
    
    // Vendor Tracking State (for View Mode Dashboard)
    const [trackingVendors, setTrackingVendors] = useState<Array<RFQVendor & { vendor_code?: string; vendor_name?: string }>>([]);


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
    // BRANCH 1: Edit Existing RFQ (editId provided)
    // ========================================================================
    useEffect(() => {
        if (!isOpen || !editId) return;

        const fetchRFQDetails = async () => {
            setIsLoadingEdit(true);
            try {
                const rfq = await RFQService.getById(editId);

                // Store raw enriched vendors for the tracking dashboard
                setTrackingVendors(rfq.vendors || []);

                // Map vendors from API response → RFQVendorFormData[]
                const mappedVendors: RFQVendorFormData[] = (rfq.vendors || []).map((v: RFQVendor & { vendor_code?: string; vendor_name?: string }) => ({
                    vendor_id: v.vendor_id,
                    vendor_code: v.vendor_code || '',
                    vendor_name: v.vendor_name || '',
                    vendor_name_display: v.vendor_code ? `${v.vendor_code} - ${v.vendor_name}` : v.vendor_name || '',
                    is_existing: true
                }));

                // Map lines
                const rfqLines: RFQLineFormData[] = (rfq.lines || []).map((line: RFQLine, i: number) => ({
                    ...initialRFQLineFormData,
                    line_no: i + 1,
                    item_code: line.item_code,
                    item_name: line.item_name,
                    description: line.description || '',
                    qty: line.qty,
                    uom: line.uom,
                    uom_id: 0, // Fallback, will be filled if available or on save
                    required_receipt_type: 'FULL',
                    target_delivery_date: line.target_delivery_date || '',
                    note_to_vendor: line.note_to_vendor || '',
                    item_id: line.item_id || undefined,
                    pr_line_id: line.pr_line_id || undefined,
                }));
                setFormData({
                    ...initialRFQFormData,
                    rfq_no: rfq.rfq_no,
                    rfq_date: rfq.rfq_date?.split('T')[0] || new Date().toLocaleDateString('en-CA'),
                    pr_id: rfq.pr_id || null,
                    pr_no: rfq.pr_no || null,
                    branch_id: rfq.branch_id || null,
                    requested_by: rfq.created_by_name || '',
                    status: (rfq.status === 'SENT' || rfq.status === 'CLOSED' || rfq.status === 'CANCELLED') ? rfq.status : 'DRAFT',
                    quotation_due_date: rfq.quotation_due_date?.split('T')[0] || '',
                    rfq_base_currency_code: rfq.rfq_base_currency_code || 'THB',
                    rfq_quote_currency_code: rfq.rfq_quote_currency_code || 'THB',
                    rfq_exchange_rate: rfq.rfq_exchange_rate || 1,
                    rfq_exchange_rate_date: rfq.rfq_exchange_rate_date || '',
                    payment_term_hint: rfq.payment_term_hint || '',
                    incoterm: rfq.incoterm || '',
                    remarks: rfq.remarks || '',
                    purpose: rfq.purpose || '',
                    receive_location: rfq.receive_location || '',
                    rfqLines: rfqLines,
                    vendors: mappedVendors,
                    isMulticurrency: (rfq.rfq_base_currency_code || 'THB') !== 'THB'
                });
                setErrors({});
                
                // --- Deep Data Mapping Fix: If RFQ lines are empty, fetch and map PR lines ---
                if (rfqLines.length === 0 && rfq.pr_id) {
                     logger.log('[RFQ] Found mapped PR but no lines. Fetching PR items...', { pr_id: rfq.pr_id });
                     try {
                         const prDetail = await PRService.getDetail(rfq.pr_id);
                         if (prDetail.lines && prDetail.lines.length > 0) {
                             const mappedPrLines: RFQLineFormData[] = prDetail.lines.map((line, index) => ({
                                line_no: index + 1,
                                item_code: line.item_code,
                                item_name: line.item_name,
                                description: line.description || line.item_name,
                                qty: line.qty,
                                uom: line.uom,
                                uom_id: Number(line.uom_id || 0),
                                required_receipt_type: line.required_receipt_type || 'FULL',
                                target_delivery_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                                note_to_vendor: line.remark || '',
                                item_id: line.item_id || undefined,
                                pr_line_id: line.pr_line_id || undefined,
                                est_unit_price: line.est_unit_price || 0,
                                est_amount: line.est_amount || 0,
                            }));
                            // Overwrite empty lines with safely mapped PR lines
                            setFormData(prev => ({ ...prev, rfqLines: mappedPrLines }));
                            // Save original PR lines state for reset functionality
                            setOriginalPRLines(mappedPrLines);
                         }
                     } catch (prError) {
                         logger.error('Failed to fetch fallback PR details:', prError);
                     }
                }
                // --- End Deep Data Mapping Fix ---

                logger.log('[RFQ] Loaded for edit', { rfq_no: rfq.rfq_no, vendors: mappedVendors.length });
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
    // BRANCH 2: Create from PR (initialPR provided, no editId)
    // ========================================================================
    useEffect(() => {
        if (!isOpen || editId) return; // Skip if editing existing

        if (initialPR?.pr_id) {
            const fetchPRDetails = async () => {
                try {
                    const fullPR = await PRService.getDetail(initialPR.pr_id);
                    // V-07: Map PR Lines to RFQ Lines with full data carryover
                    const rfqLines: RFQLineFormData[] = (fullPR.lines || []).map((line, index) => ({
                        line_no: index + 1,
                        item_code: line.item_code,
                        item_name: line.item_name,
                        description: line.description || line.item_name,
                        qty: line.qty,
                        uom: line.uom,
                        uom_id: Number(line.uom_id || 0),
                        required_receipt_type: line.required_receipt_type || 'FULL',
                        target_delivery_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                        note_to_vendor: line.remark || '',
                        // V-07: Traceability & pricing fields
                        item_id: line.item_id || undefined,
                        pr_line_id: line.pr_line_id || undefined,
                        est_unit_price: line.est_unit_price || 0,
                        est_amount: line.est_amount || 0,
                    }));
                    
                    setOriginalPRLines(rfqLines);
                    // Determine Multicurrency State from PR
                    const isMulti = fullPR.pr_base_currency_code !== 'THB';

                    // V-07: Pre-fill vendor from PR's preferred_vendor_id
                    const initialVendors = fullPR.preferred_vendor_id 
                        ? [{
                            vendor_id: fullPR.preferred_vendor_id,
                            vendor_code: '',
                            vendor_name: fullPR.vendor_name || '',
                            vendor_name_display: fullPR.vendor_name || '(Preferred Vendor from PR)',
                        }]
                        : [{ vendor_code: '', vendor_name: '', vendor_name_display: '' }];

                    setFormData({
                        ...initialRFQFormData,
                        rfq_no: 'DRAFT',
                        rfq_date: new Date().toLocaleDateString('en-CA'),
                        pr_id: fullPR.pr_id,
                        pr_no: fullPR.pr_no,
                        branch_id: fullPR.branch_id,
                        project_id: fullPR.project_id || null,
                        requested_by: 'ระบบจะกรอกอัตโนมัติ',
                        status: 'DRAFT',
                        quotation_due_date: '',
                        
                        // Multicurrency Mapping
                        isMulticurrency: isMulti,
                        rfq_base_currency_code: fullPR.pr_base_currency_code,
                        rfq_quote_currency_code: fullPR.pr_quote_currency_code || 'THB',
                        rfq_exchange_rate: fullPR.pr_exchange_rate || 1,
                        rfq_exchange_rate_date: fullPR.pr_exchange_rate_date ? fullPR.pr_exchange_rate_date.split('T')[0] : '',

                        payment_term_hint: '',
                        incoterm: '',
                        // V-07: Carry over original remark + append PR reference
                        remarks: fullPR.remark
                            ? `${fullPR.remark}\n[PR: ${fullPR.pr_no}]`
                            : `Generated from PR: ${fullPR.pr_no}`,
                        // V-07: Carry over purpose, cost center, tax
                        purpose: fullPR.purpose || '',
                        cost_center_id: fullPR.cost_center_id || undefined,
                        pr_tax_code_id: fullPR.pr_tax_code_id || undefined,
                        pr_tax_rate: fullPR.pr_tax_rate || undefined,
                        rfqLines: rfqLines,
                        vendors: initialVendors,
                    });
                    
                    // Clear any previous errors
                    setErrors({});

                } catch (error) {
                    logger.error('Failed to fetch PR details for RFQ:', error);
                    toast('ไม่สามารถดึงข้อมูล PR ได้', 'error');
                }
            };
            fetchPRDetails();
        } else {
             // Reset to empty if no PR (Create New standalone)
             setFormData({
                ...initialRFQFormData,
                 rfq_no: 'DRAFT',
                 rfqLines: Array.from({ length: 5 }, (_, i) => ({
                    ...initialRFQLineFormData,
                    line_no: i + 1,
                })),
            });
            setErrors({});
        }
    }, [isOpen, editId, initialPR, toast]);


    // ========================================================================
    // BRANCH 3: Deep PR ID Cascade Watch 
    // Automatically inherit PR items if pr_id changes AND table is empty
    // ========================================================================
    useEffect(() => {
        if (!isOpen) return;
        
        const tryFetchPRLines = async () => {
            if (!formData.pr_id) return;
            
            // Overwrite Guard: ONLY overwrite if lines are empty OR explicitly requested.
            // We check if the table truly has no entered data.
            const hasData = formData.rfqLines.some(l => (l.item_code && l.item_code.trim() !== '') || l.item_id || (l.description && l.description.trim() !== ''));
            if (hasData) return; // Never blindly overwrite user data
            
            try {
                const prDetail = await PRService.getDetail(formData.pr_id);
                if (prDetail.lines && prDetail.lines.length > 0) {
                    const mappedPrLines: RFQLineFormData[] = prDetail.lines.map((line, index) => ({
                        line_no: index + 1,
                        item_code: line.item_code,
                        item_name: line.item_name,
                        description: line.description || line.item_name,
                        qty: line.qty,
                        uom: line.uom,
                        uom_id: Number(line.uom_id || 0),
                        required_receipt_type: line.required_receipt_type || 'FULL',
                        target_delivery_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                        note_to_vendor: line.remark || '',
                        item_id: line.item_id || undefined,
                        pr_line_id: line.pr_line_id || undefined,
                        est_unit_price: line.est_unit_price || 0,
                        est_amount: line.est_amount || 0,
                    }));
                    
                    // Replace empty table with mapped PR data
                    setFormData(prev => ({ ...prev, rfqLines: mappedPrLines }));
                    setOriginalPRLines(mappedPrLines);
                    
                    // Auto-sync currency settings if the table was empty
                    const isMulti = prDetail.pr_base_currency_code !== 'THB';
                    setFormData(prev => ({
                        ...prev,
                        isMulticurrency: isMulti,
                        rfq_base_currency_code: prDetail.pr_base_currency_code,
                        rfq_quote_currency_code: prDetail.pr_quote_currency_code || prev.rfq_quote_currency_code,
                        rfq_exchange_rate: prDetail.pr_exchange_rate || 1,
                    }));
                }
            } catch (error) {
                logger.error('Failed to auto-fetch PR lines:', error);
            }
        };

        tryFetchPRLines();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.pr_id, isOpen]);

    // Validation State & Schema
    const [errors, setErrors] = useState<Record<string, string>>({});

    const rfqSchema = z.object({
        isMulticurrency: z.boolean(),
        rfq_base_currency_code: z.string(),
        rfq_exchange_rate: z.number(),
    }).superRefine((data, ctx) => {
        if (data.isMulticurrency) {
             if (!data.rfq_base_currency_code || data.rfq_base_currency_code === 'THB') {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "กรุณาระบุสกุลเงินต่างประเทศ",
                    path: ["rfq_base_currency_code"]
                });
            }
            if (!data.rfq_exchange_rate || data.rfq_exchange_rate <= 0) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "กรุณาระบุอัตราแลกเปลี่ยน",
                    path: ["rfq_exchange_rate"]
                });
            }
        }
    });

    const validateForm = (data: RFQFormData) => {
        try {
             // Validate Zod schema
            rfqSchema.parse(data);
             // Basic manual validation
             const manualErrors: Record<string, string> = {};
             if (!data.quotation_due_date) manualErrors['quotation_due_date'] = 'กรุณาระบุ ใช้ได้ถึงวันที่ (Quote Due Date)';
             
             const hasValidLine = data.rfqLines.some(l => (l.item_code && l.item_code.trim() !== '') || l.item_id || (l.description && l.description.trim() !== ''));
             if (!hasValidLine) manualErrors['rfqLines'] = 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ';

             if (Object.keys(manualErrors).length > 0) {
                 setErrors(manualErrors);
                 return false;
             }
            
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.issues.forEach(err => {
                    if (err.path[0]) newErrors[err.path[0] as string] = err.message;
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    // Effect: Reset currency when isMulticurrency is turned off
    useEffect(() => {
        if (!formData.isMulticurrency) {
             setFormData(prev => {
                if (prev.rfq_base_currency_code !== 'THB' || prev.rfq_exchange_rate !== 1) {
                    return { ...prev, rfq_base_currency_code: 'THB', rfq_exchange_rate: 1 };
                }
                return prev;
             });
             // Clear errors for currency fields
             setErrors(prev => {
                 const newErrors = { ...prev };
                 delete newErrors.rfq_base_currency_code;
                 delete newErrors.rfq_exchange_rate;
                 return newErrors;
             });
        }
    }, [formData.isMulticurrency]);

    const handleChange = useCallback((field: keyof RFQFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field immediately (mimics RHF onBlur/onChange)
        setErrors(prev => {
            if (prev[field as string]) {
                const next = { ...prev };
                delete next[field as string];
                return next;
            }
            return prev;
        });
    }, []);

    const handleLineChange = useCallback((index: number, field: keyof RFQLineFormData, value: string | number) => {
        setFormData(prev => {
            const newLines = [...prev.rfqLines];
            newLines[index] = { ...newLines[index], [field]: value };
            return { ...prev, rfqLines: newLines };
        });
    }, []);

    const handleAddLine = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            rfqLines: [...prev.rfqLines, { ...initialRFQLineFormData, line_no: prev.rfqLines.length + 1 }],
        }));
    }, []);
    
    const handleResetLines = useCallback(() => {
        if (originalPRLines.length === 0) return;
        
        // Deep copy to prevent reference mutation
        const resetLines = originalPRLines.map(line => ({ ...line }));
        
        setFormData(prev => ({
            ...prev,
            rfqLines: resetLines
        }));
        
        toast('คืนค่ารายการสินค้าจาก PR เรียบร้อย', 'success');
    }, [originalPRLines, toast]);

    const handleRemoveLine = useCallback((index: number) => {
        if (formData.rfqLines.length <= 1) {
            toast('ต้องมีอย่างน้อย 1 รายการ', 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            rfqLines: prev.rfqLines.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })),
        }));
    }, [formData.rfqLines.length, toast]);

    const handleSave = async () => {
        // ═══════════════════════════════════════════════════════════════
        // INLINE VALIDATION — Check required fields before sending
        // ═══════════════════════════════════════════════════════════════
        const newErrors: Record<string, string> = {};
        
        if (!formData.rfq_no) newErrors.rfq_no = 'กรุณากรอกเลขที่ RFQ';
        if (!formData.rfq_date) newErrors.rfq_date = 'กรุณาระบุวันที่สร้าง RFQ';
        if (!formData.pr_no && !formData.pr_id) newErrors.pr_no = 'กรุณาระบุ PR ต้นทาง';
        if (!formData.status) newErrors.status = 'กรุณาระบุสถานะ';
        if (!formData.quotation_due_date) newErrors.quotation_due_date = 'กรุณาระบุวันกำหนดส่งใบเสนอราคา';
        
        // branch_id is REQUIRED by backend (must be a number, not empty)
        if (!formData.branch_id) newErrors.branch_id = 'กรุณาเลือกสาขา';
        
        // Validate lines: accept if item_code OR item_id OR description is present
        const validLines = formData.rfqLines.filter(l =>
            (l.item_code && l.item_code.trim() !== '') ||
            l.item_id ||
            (l.description && l.description.trim() !== '')
        );
        if (validLines.length === 0) {
            newErrors.rfqLines = 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            logger.error('[RFQ handleSave] Validation errors:', newErrors);
            toast('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึกเอกสาร', 'error');
            return;
        }

        setErrors({});
        setIsSaving(true);
        try {
            // ═══════════════════════════════════════════════════════════════
            // 🔒 FORENSIC FIX v3 (2026-03-06): THE DOUBLE REQUESTER STRIKE
            // Root cause: Backend DTO requires BOTH fields simultaneously:
            //   - requested_by_user_id (NUMBER) = employee ID
            //   - requested_by (STRING) = employee name
            // When we sent only one, backend threw 400 demanding the other.
            //
            // TWO-STEP TRANSACTION:
            //   Step 1: Create RFQ Header + Lines (NO vendors)
            //   Step 2: Associate vendors via separate endpoint
            //
            // FORBIDDEN on header: vendor_ids, rfqVendorIds,
            //   isMulticurrency, rfq_no, pr_no, pr_tax_code_id,
            //   pr_tax_rate, vendors
            //
            // REQUIRED on header:
            //   ✅ requested_by_user_id (NUMBER, non-empty)
            //   ✅ requested_by (STRING, non-empty)
            //
            // FORBIDDEN on lines: item_code, item_name, uom, est_unit_price, est_amount
            // ═══════════════════════════════════════════════════════════════
            
            // Sanitize lines: ONLY fields the backend CreateRfqLineDto accepts
            const cleanLines: RFQLineDTO[] = formData.rfqLines
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
                    // NOTE: item_code, item_name, uom, est_unit_price are NOT sent
                    // They are display-only fields stored in the form but forbidden by backend DTO
                    return dto;
                });

            // 🎯 THE DOUBLE REQUESTER STRIKE: Backend demands BOTH fields simultaneously.
            //   - requested_by_user_id: NUMBER (employee ID)
            //   - requested_by: STRING (employee name)
            const resolvedRequestedByUserId: number = Number(
                formData.requested_by_user_id || 1  // Fallback: never send empty/NaN
            );
            const resolvedRequestedByName: string = String(
                formData.requested_by || 'System User'  // Fallback: never send empty string
            );

            // Build clean payload matching backend CreateRfqDto EXACTLY
            // 🚫 NO vendor_ids — backend rejects this property
            // ✅ BOTH requested_by_user_id (number) AND requested_by (string) — backend demands both
            const payload: RFQCreateDTO = {
                rfq_date: String(formData.rfq_date),
                requested_by_user_id: resolvedRequestedByUserId,  // 🎯 NUMBER (employee ID)
                requested_by: resolvedRequestedByName,            // 🎯 STRING (employee name)
                status: formData.status || 'DRAFT',
                quotation_due_date: String(formData.quotation_due_date),
                branch_id: Number(formData.branch_id), // REQUIRED by backend, validated above
                rfq_base_currency_code: String(formData.rfq_base_currency_code || 'THB'),
                rfq_quote_currency_code: String(formData.rfq_quote_currency_code || 'THB'),
                rfq_exchange_rate: Number(formData.rfq_exchange_rate || 1),
                rfq_exchange_rate_date: String(formData.rfq_exchange_rate_date || formData.rfq_date),
                remarks: String(formData.remarks || ''),
                // 🚫 vendor_ids: REMOVED — will be sent in Step 2
                rfqLines: cleanLines,
            };

            // Conditionally add optional fields
            if (formData.pr_id) payload.pr_id = Number(formData.pr_id);
            if (formData.project_id) payload.project_id = Number(formData.project_id);
            if (formData.receive_location) payload.receive_location = String(formData.receive_location);
            if (formData.payment_term_hint) payload.payment_term_hint = String(formData.payment_term_hint);
            if (formData.incoterm) payload.incoterm = String(formData.incoterm);
            if (formData.purpose) payload.purpose = String(formData.purpose);

            // Collect vendor IDs for Step 2 (separate from creation payload)
            const selectedVendorIds = formData.vendors
                .filter(v => v.vendor_id)
                .map(v => Number(v.vendor_id));

            logger.info('[RFQ handleSave] Payload ready:', {
                fields: Object.keys(payload),
                lineCount: cleanLines.length,
                vendorCount: selectedVendorIds.length,
                branch_id: payload.branch_id,
                requested_by_user_id: payload.requested_by_user_id,
                requested_by: payload.requested_by,  // 🎯 Log both requester fields
            });

            if (editId) {
                // ══════════════════════════════════════════════════════════
                // Edit mode: update existing RFQ
                // ══════════════════════════════════════════════════════════
                await RFQService.update(editId, payload);
                logger.log('[RFQ] Updated successfully', { rfq_no: formData.rfq_no, editId });
            } else {
                // ══════════════════════════════════════════════════════════
                // Create mode: TWO-STEP TRANSACTION
                // Step 1: Create RFQ Header + Lines (no vendors)
                // Step 2: Associate vendors to the new RFQ ID
                // ══════════════════════════════════════════════════════════
                const createdRFQ = await RFQService.create(payload);
                logger.log('[RFQ] Step 1 Complete: RFQ created', {
                    rfq_id: createdRFQ.rfq_id,
                    rfq_no: createdRFQ.rfq_no || formData.rfq_no,
                    pr_id: formData.pr_id,
                });

                // Step 2: Associate vendors (if any were selected)
                if (selectedVendorIds.length > 0 && createdRFQ.rfq_id) {
                    try {
                        await RFQService.addVendorsToRFQ(
                            String(createdRFQ.rfq_id),
                            selectedVendorIds
                        );
                        logger.log('[RFQ] Step 2 Complete: Vendors associated', {
                            rfq_id: createdRFQ.rfq_id,
                            vendorCount: selectedVendorIds.length,
                        });
                    } catch (vendorError) {
                        // Non-fatal: RFQ was created successfully, vendor mapping failed
                        // This may happen if the backend doesn't have the endpoint yet
                        logger.warn('[RFQ] Step 2 Warning: Vendor association failed (non-fatal)', vendorError);
                        toast(
                            'RFQ สร้างสำเร็จแล้ว แต่ยังไม่สามารถผูกผู้ขายได้ (สามารถเพิ่มภายหลังได้)',
                            'warning'
                        );
                    }
                }
            }

            // Call onSuccess callback (async - refetch list + close)
            if (onSuccess) {
                await onSuccess();
            }
            onClose();
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก RFQ';
            logger.error('Failed to save RFQ:', errMsg);
            toast(errMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ========================================================================
    // MAGIC AUTO-FILL: PR Selection Handler
    // ========================================================================
    const handlePRSelect = useCallback(async (prRecord: PRHeader) => {
        setIsPRSelectionModalOpen(false);
        try {
            setIsLoadingEdit(true);
            
            // Deep Fetch: Get full PR with lines array
            const fullPR = await PRService.getDetail(prRecord.pr_id);
            
            // Defensive: Use list-level data as fallback for key identifiers
            const prId = fullPR.pr_id || prRecord.pr_id;
            const prNo = fullPR.pr_no || prRecord.pr_no;
            
            logger.info('[RFQ handlePRSelect] Deep fetch result:', {
                pr_id: prId,
                pr_no: prNo,
                linesCount: fullPR.lines?.length ?? 0,
                hasRemark: Boolean(fullPR.remark),
                hasPurpose: Boolean(fullPR.purpose),
            });
            
            // 🔍 Diagnostic: Log raw line structure to detect field name mismatches
            if (fullPR.lines && fullPR.lines.length > 0) {
                const sampleLine = fullPR.lines[0];
                logger.info('[RFQ handlePRSelect] 🔍 RAW LINE[0] KEYS:', Object.keys(sampleLine));
                logger.info('[RFQ handlePRSelect] 🔍 RAW LINE[0] DATA:', JSON.stringify(sampleLine, null, 2));
            } else {
                // Check if lines might be under a different key
                const fullPRKeys = Object.keys(fullPR);
                logger.warn('[RFQ handlePRSelect] ⚠️ No lines found! Full PR keys:', fullPRKeys);
                // Check for alternative line array keys
                const possibleLineKeys = fullPRKeys.filter(k =>
                    k.includes('line') || k.includes('item') || k.includes('detail')
                );
                logger.warn('[RFQ handlePRSelect] ⚠️ Possible line keys:', possibleLineKeys);
            }
            
            // 🎯 Phase 1: Strict Line Mapping (sanitize: NO remark on lines)
            // Backend PR detail returns item_id/uom_id as numeric IDs without display names.
            // We resolve item_code/item_name/uom from loaded master data.
            const rawLines = fullPR.lines || [];
            const rfqLines: RFQLineFormData[] = rawLines.map((line, index) => {
                const lineItemId = String(line.item_id || '');
                const lineUomId = String(line.uom_id || '');
                
                // Master data lookup: resolve display names from IDs
                const masterItem = items.find(i => String(i.item_id) === lineItemId);
                const masterUnit = units.find(u =>
                    String(u.unit_id) === lineUomId ||
                    String(u.uom_id) === lineUomId
                );
                
                const resolvedItemCode = line.item_code || masterItem?.item_code || '';
                const resolvedItemName = line.item_name || masterItem?.item_name || '';
                const resolvedUom = line.uom || masterUnit?.unit_name || masterUnit?.uom_name || '';
                const resolvedDesc = String(line.description || resolvedItemName || '');
                
                return {
                    ...initialRFQLineFormData,
                    line_no: index + 1,
                    item_id: lineItemId || undefined,
                    item_code: resolvedItemCode,
                    item_name: resolvedItemName,
                    description: resolvedDesc,
                    qty: Number(line.qty || 0),
                    uom: resolvedUom,
                    uom_id: Number(line.uom_id || 0),
                    required_receipt_type: line.required_receipt_type || 'FULL',
                    target_delivery_date: line.needed_date ? String(line.needed_date).split('T')[0] : '',
                    note_to_vendor: '',
                    pr_line_id: line.pr_line_id ? String(line.pr_line_id) : undefined,
                    est_unit_price: Number(line.est_unit_price || 0),
                    est_amount: Number(line.est_amount || 0),
                };
            });
            
            // 🔍 Diagnostic: Log mapped result
            if (rfqLines.length > 0) {
                logger.info('[RFQ handlePRSelect] 🔍 MAPPED LINE[0]:', JSON.stringify(rfqLines[0], null, 2));
            }

            setOriginalPRLines(rfqLines);

            // 🎯 Phase 2: Currency & Vendor Logic
            const isMulti = fullPR.pr_base_currency_code !== 'THB';
            
            const initialVendors = fullPR.preferred_vendor_id
                ? [{
                    vendor_id: fullPR.preferred_vendor_id,
                    vendor_code: '',
                    vendor_name: fullPR.vendor_name || '',
                    vendor_name_display: fullPR.vendor_name || '(Preferred Vendor from PR)',
                }]
                : [];

            // 🎯 Phase 3: Header State Update (Strict Sync)
            // Default quotation_due_date to 7 days from now if not set
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 7);
            const defaultDueDateStr = defaultDueDate.toLocaleDateString('en-CA');
            
            setFormData(prev => ({
                ...prev,
                pr_id: prId,
                pr_no: prNo,
                branch_id: fullPR.branch_id || prRecord.branch_id,
                project_id: fullPR.project_id || prRecord.project_id || null,
                quotation_due_date: prev.quotation_due_date || defaultDueDateStr,
                isMulticurrency: isMulti,
                rfq_base_currency_code: fullPR.pr_base_currency_code || prev.rfq_base_currency_code,
                rfq_quote_currency_code: fullPR.pr_quote_currency_code || prev.rfq_quote_currency_code,
                rfq_exchange_rate: fullPR.pr_exchange_rate || 1,
                rfq_exchange_rate_date: fullPR.pr_exchange_rate_date ? fullPR.pr_exchange_rate_date.split('T')[0] : prev.rfq_exchange_rate_date,
                remarks: fullPR.remark ? `${fullPR.remark}\n[PR: ${prNo}]` : `Generated from PR: ${prNo}`,
                purpose: fullPR.purpose || prRecord.purpose || '',
                cost_center_id: fullPR.cost_center_id || undefined,
                pr_tax_code_id: fullPR.pr_tax_code_id || undefined,
                pr_tax_rate: fullPR.pr_tax_rate || undefined,
                rfqLines: rfqLines,
                vendors: initialVendors.length > 0 ? initialVendors : prev.vendors,
            }));
            
            toast(`ดึงรายการสินค้าจาก PR ${prNo} เรียบร้อย (${rfqLines.length} รายการ)`, 'success');
        } catch (error) {
            logger.error('Failed to load PR details:', error);
            toast('ไม่สามารถโหลดข้อมูล PR ได้', 'error');
        } finally {
            setIsLoadingEdit(false);
        }
    }, [toast, items, units]);
    // Vendor Search State
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [activeVendorIndex, setActiveVendorIndex] = useState<number | null>(null);

    // Vendor Handlers
    // "Add Vendor" → opens modal directly (no empty slot)
    const handleAddVendor = useCallback(() => {
        setActiveVendorIndex(null); // null = append mode
        setIsVendorModalOpen(true);
    }, []);

    const handleRemoveVendor = useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            vendors: prev.vendors.filter((_, i) => i !== index)
        }));
    }, []);

    // "Search icon" on existing row → opens modal to replace that slot
    const handleOpenVendorModal = (index: number) => {
        setActiveVendorIndex(index);
        setIsVendorModalOpen(true);
    };

    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setFormData(prev => {
            // ── Duplicate Prevention ──
            const alreadyExists = prev.vendors.some(v => v.vendor_id === vendor.vendor_id);
            if (alreadyExists) {
                toast('ผู้ขายรายนี้อยู่ในรายการแล้ว', 'warning');
                return prev; // No mutation
            }

            const newVendorEntry = {
                vendor_id: vendor.vendor_id,
                vendor_code: vendor.code,
                vendor_name: vendor.name,
                vendor_name_display: `${vendor.code} - ${vendor.name}`
            };

            if (activeVendorIndex !== null) {
                // Replace existing slot (Search icon flow)
                const newVendors = [...prev.vendors];
                newVendors[activeVendorIndex] = newVendorEntry;
                return { ...prev, vendors: newVendors };
            } else {
                // Append new vendor (Add flow)
                return { ...prev, vendors: [...prev.vendors, newVendorEntry] };
            }
        });
        setIsVendorModalOpen(false);
        setActiveVendorIndex(null);
    };



    return {
        formData,
        isSaving,
        isLoadingEdit,
        activeTab,
        setActiveTab,
        trackingVendors,
        branches,
        items,
        units,
        
        isPRSelectionModalOpen,
        setIsPRSelectionModalOpen,
        handlePRSelect,
        handleChange,
        handleLineChange,
        handleResetLines,
        handleAddLine,
        handleRemoveLine,
        handleSave,
        
        // RFQ Reset Info
        originalLinesCount: originalPRLines.length,
        
        // Vendor Exports
        isVendorModalOpen,
        setIsVendorModalOpen,
        handleAddVendor,
        handleRemoveVendor,
        handleOpenVendorModal,
        handleVendorSelect,

        errors, 
        validateForm
    };
};