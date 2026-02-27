import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { MasterDataService } from '@/modules/master-data';
import type { BranchListItem, ItemListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { RFQFormData, RFQLineFormData, RFQCreateData, RFQVendor, RFQVendorFormData, RFQLine } from '@/modules/procurement/types';
import { initialRFQFormData, initialRFQLineFormData } from '@/modules/procurement/types/rfq-types';
import type { PRHeader } from '@/modules/procurement/types';

import { PRService } from '@/modules/procurement/services/pr.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';



export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void, editId?: string | null) => {
    const [formData, setFormData] = useState<RFQFormData>({
        ...initialRFQFormData,
        rfq_no: 'DRAFT',
        rfq_date: new Date().toLocaleDateString('en-CA'),
        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
        lines: [],
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
                    item_description: line.item_description || '',
                    required_qty: line.required_qty,
                    uom: line.uom,
                    required_date: line.required_date || '',
                    remarks: line.remark || '',
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
                    created_by_name: rfq.created_by_name || '',
                    status: rfq.status || 'DRAFT',
                    quote_due_date: rfq.quote_due_date?.split('T')[0] || '',
                    currency: rfq.currency || 'THB',
                    exchange_rate: rfq.exchange_rate || 1,
                    payment_terms: rfq.payment_terms || '',
                    incoterm: rfq.incoterm || '',
                    remarks: rfq.remarks || '',
                    purpose: rfq.purpose || '',
                    delivery_location: rfq.delivery_location || '',
                    lines: rfqLines,
                    vendors: mappedVendors,
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
                                item_description: line.description || line.item_name,
                                required_qty: line.qty,
                                uom: line.uom,
                                required_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                                remarks: line.remark || '',
                                item_id: line.item_id || undefined,
                                pr_line_id: line.pr_line_id || undefined,
                                est_unit_price: line.est_unit_price || 0,
                                est_amount: line.est_amount || 0,
                            }));
                            // Overwrite empty lines with safely mapped PR lines
                            setFormData(prev => ({ ...prev, lines: mappedPrLines }));
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
                        item_description: line.description || line.item_name,
                        required_qty: line.qty,
                        uom: line.uom,
                        required_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                        remarks: line.remark || '',
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
                        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
                        status: 'DRAFT',
                        quote_due_date: '',
                        
                        // Multicurrency Mapping
                        isMulticurrency: isMulti,
                        currency: fullPR.pr_base_currency_code,
                        target_currency: fullPR.pr_quote_currency_code || 'THB',
                        exchange_rate: fullPR.pr_exchange_rate || 1,
                        exchange_rate_date: fullPR.pr_exchange_rate_date ? fullPR.pr_exchange_rate_date.split('T')[0] : '',

                        payment_terms: '',
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
                        lines: rfqLines,
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
                 lines: Array.from({ length: 5 }, (_, i) => ({
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
            const hasData = formData.lines.some(l => l.item_code && l.item_code.trim() !== '');
            if (hasData) return; // Never blindly overwrite user data
            
            try {
                const prDetail = await PRService.getDetail(formData.pr_id);
                if (prDetail.lines && prDetail.lines.length > 0) {
                    const mappedPrLines: RFQLineFormData[] = prDetail.lines.map((line, index) => ({
                        line_no: index + 1,
                        item_code: line.item_code,
                        item_name: line.item_name,
                        item_description: line.description || line.item_name,
                        required_qty: line.qty,
                        uom: line.uom,
                        required_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                        remarks: line.remark || '',
                        item_id: line.item_id || undefined,
                        pr_line_id: line.pr_line_id || undefined,
                        est_unit_price: line.est_unit_price || 0,
                        est_amount: line.est_amount || 0,
                    }));
                    
                    // Replace empty table with mapped PR data
                    setFormData(prev => ({ ...prev, lines: mappedPrLines }));
                    setOriginalPRLines(mappedPrLines);
                    
                    // Auto-sync currency settings if the table was empty
                    const isMulti = prDetail.pr_base_currency_code !== 'THB';
                    setFormData(prev => ({
                        ...prev,
                        isMulticurrency: isMulti,
                        currency: prDetail.pr_base_currency_code,
                        target_currency: prDetail.pr_quote_currency_code || prev.target_currency,
                        exchange_rate: prDetail.pr_exchange_rate || 1,
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
        currency: z.string(),
        exchange_rate: z.number(),
    }).superRefine((data, ctx) => {
        if (data.isMulticurrency) {
             if (!data.currency || data.currency === 'THB') {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "กรุณาระบุสกุลเงินต่างประเทศ",
                    path: ["currency"]
                });
            }
            if (!data.exchange_rate || data.exchange_rate <= 0) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "กรุณาระบุอัตราแลกเปลี่ยน",
                    path: ["exchange_rate"]
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
             if (!data.quote_due_date) manualErrors['quote_due_date'] = 'กรุณาระบุ ใช้ได้ถึงวันที่ (Quote Due Date)';
             
             const hasValidLine = data.lines.some(l => l.item_code && l.item_code.trim() !== '');
             if (!hasValidLine) manualErrors['lines'] = 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ';

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
                if (prev.currency !== 'THB' || prev.exchange_rate !== 1) {
                    return { ...prev, currency: 'THB', exchange_rate: 1 };
                }
                return prev;
             });
             // Clear errors for currency fields
             setErrors(prev => {
                 const newErrors = { ...prev };
                 delete newErrors.currency;
                 delete newErrors.exchange_rate;
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
            const newLines = [...prev.lines];
            newLines[index] = { ...newLines[index], [field]: value };
            return { ...prev, lines: newLines };
        });
    }, []);

    const handleAddLine = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { ...initialRFQLineFormData, line_no: prev.lines.length + 1 }],
        }));
    }, []);
    
    const handleResetLines = useCallback(() => {
        if (originalPRLines.length === 0) return;
        
        // Deep copy to prevent reference mutation
        const resetLines = originalPRLines.map(line => ({ ...line }));
        
        setFormData(prev => ({
            ...prev,
            lines: resetLines
        }));
        
        toast('คืนค่ารายการสินค้าจาก PR เรียบร้อย', 'success');
    }, [originalPRLines, toast]);

    const handleRemoveLine = useCallback((index: number) => {
        if (formData.lines.length <= 1) {
            toast('ต้องมีอย่างน้อย 1 รายการ', 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })),
        }));
    }, [formData.lines.length, toast]);

    const handleSave = async () => {
        // Inline Validation & Toast
        const newErrors: Record<string, string> = {};
        
        if (!formData.rfq_no) newErrors.rfq_no = 'กรุณากรอกเลขที่ RFQ';
        if (!formData.rfq_date) newErrors.rfq_date = 'กรุณาระบุวันที่สร้าง RFQ';
        if (!formData.pr_no && !formData.pr_id) newErrors.pr_no = 'กรุณาระบุ PR ต้นทาง';
        if (!formData.status) newErrors.status = 'กรุณาระบุสถานะ';
        if (!formData.quote_due_date) newErrors.quote_due_date = 'กรุณาระบุวันกำหนดส่งใบเสนอราคา';
        
        const validLines = formData.lines.filter(l => l.item_code?.trim());
        if (validLines.length === 0) { 
            newErrors.lines = 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast(Object.values(newErrors)[0], 'error');
            return;
        }

        setErrors({});
        setIsSaving(true);
        try {
            const payload: RFQCreateData = {
                ...formData,
                // Filter out empty lines (no item_code)
                lines: formData.lines.filter(l => l.item_code?.trim()),
                // Extract vendor IDs for the junction table
                vendor_ids: formData.vendors
                    .filter(v => v.vendor_id)
                    .map(v => v.vendor_id!),
            };

            if (editId) {
                // ── Edit mode: update existing RFQ ──
                await RFQService.update(editId, payload);
                logger.log('[RFQ] Updated successfully', { rfq_no: formData.rfq_no, editId });
            } else {
                // ── Create mode: new RFQ ──
                await RFQService.create(payload);
                logger.log('[RFQ] Created successfully', { rfq_no: formData.rfq_no, pr_id: formData.pr_id });
            }

            // Call onSuccess callback (async - refetch list + close)
            if (onSuccess) {
                await onSuccess();
            }
            onClose();
        } catch (error) {
            logger.error('Failed to save RFQ:', error);
            toast('เกิดข้อผิดพลาดในการบันทึก RFQ', 'error');
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
            const fullPR = await PRService.getDetail(prRecord.pr_id);
            
            const rfqLines: RFQLineFormData[] = (fullPR.lines || []).map((line, index) => ({
                ...initialRFQLineFormData,
                line_no: index + 1,
                item_code: line.item_code,
                item_name: line.item_name,
                item_description: line.description || line.item_name,
                required_qty: line.qty,
                uom: line.uom,
                required_date: line.needed_date ? line.needed_date.split('T')[0] : '',
                remarks: line.remark || '',
                item_id: line.item_id || undefined,
                pr_line_id: line.pr_line_id || undefined,
                est_unit_price: line.est_unit_price || 0,
                est_amount: line.est_amount || 0,
            }));

            setOriginalPRLines(rfqLines);

            const isMulti = fullPR.pr_base_currency_code !== 'THB';
            
            const initialVendors = fullPR.preferred_vendor_id 
                ? [{
                    vendor_id: fullPR.preferred_vendor_id,
                    vendor_code: '',
                    vendor_name: fullPR.vendor_name || '',
                    vendor_name_display: fullPR.vendor_name || '(Preferred Vendor from PR)',
                }]
                : []; // Note: Start fresh. 

            setFormData(prev => ({
                ...prev,
                pr_id: fullPR.pr_id,
                pr_no: fullPR.pr_no,
                branch_id: fullPR.branch_id,
                project_id: fullPR.project_id || null,
                isMulticurrency: isMulti,
                currency: fullPR.pr_base_currency_code,
                target_currency: fullPR.pr_quote_currency_code || prev.target_currency,
                exchange_rate: fullPR.pr_exchange_rate || 1,
                exchange_rate_date: fullPR.pr_exchange_rate_date ? fullPR.pr_exchange_rate_date.split('T')[0] : prev.exchange_rate_date,
                remarks: fullPR.remark ? `${fullPR.remark}\n[PR: ${fullPR.pr_no}]` : `Generated from PR: ${fullPR.pr_no}`,
                purpose: fullPR.purpose || '',
                cost_center_id: fullPR.cost_center_id || undefined,
                pr_tax_code_id: fullPR.pr_tax_code_id || undefined,
                pr_tax_rate: fullPR.pr_tax_rate || undefined,
                lines: rfqLines,
                vendors: initialVendors.length > 0 ? initialVendors : [{ vendor_code: '', vendor_name: '', vendor_name_display: '' }],
            }));
            
            toast(`ดึงรายการสินค้าจาก PR ${fullPR.pr_no} เรียบร้อย`, 'success');
        } catch (error) {
            logger.error('Failed to load PR details:', error);
            toast('ไม่สามารถโหลดข้อมูล PR ได้', 'error');
        } finally {
            setIsLoadingEdit(false);
        }
    }, [toast]);
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