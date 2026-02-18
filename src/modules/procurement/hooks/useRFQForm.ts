import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { MasterDataService } from '@/modules/master-data';
import type { BranchListItem, ItemListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { RFQFormData, RFQLineFormData } from '@/modules/procurement/types/rfq-types';
import { initialRFQFormData, initialRFQLineFormData } from '@/modules/procurement/types/rfq-types';
import type { PRHeader } from '@/modules/procurement/types/pr-types';

import { PRService } from '@/modules/procurement/services/pr.service';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';



export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void) => {
    const [formData, setFormData] = useState<RFQFormData>({
        ...initialRFQFormData,
        rfq_no: `RFQ2024-007`,
        rfq_date: new Date().toLocaleDateString('en-CA'),
        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
        lines: Array.from({ length: 5 }, (_, i) => ({
            ...initialRFQLineFormData,
            line_no: i + 1,
        })),
    });

    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');
    


    // Master Data State
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [units, setUnits] = useState<UnitListItem[]>([]);

    // Product Search State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

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

    // Fetch PR Data & Reset/Prefill Logic
    // Fetch PR Data & Reset/Prefill Logic
    useEffect(() => {
        if (isOpen && initialPR?.pr_id) {
            const fetchPRDetails = async () => {
                try {
                    const fullPR = await PRService.getDetail(initialPR.pr_id);
                    // Map PR Lines to RFQ Lines
                    const rfqLines: RFQLineFormData[] = (fullPR.lines || []).map((line, index) => ({
                        line_no: index + 1,
                        item_code: line.item_code,
                        item_name: line.item_name,
                        item_description: line.description || line.item_name,
                        required_qty: line.qty,
                        uom: line.uom,
                        required_date: line.needed_date ? line.needed_date.split('T')[0] : '', // Format YYYY-MM-DD
                        remarks: line.remark || '',
                    }));

                    // Fill remaining lines to minimum 5
                    while (rfqLines.length < 5) {
                        rfqLines.push({
                            ...initialRFQLineFormData,
                            line_no: rfqLines.length + 1
                        });
                    }

                    // Determine Multicurrency State from PR
                    const isMulti = fullPR.pr_base_currency_code !== 'THB';

                    setFormData({
                        ...initialRFQFormData,
                        rfq_no: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Mock Type
                        rfq_date: new Date().toLocaleDateString('en-CA'),
                        pr_id: fullPR.pr_id,
                        pr_no: fullPR.pr_no,
                        branch_id: fullPR.branch_id,
                        project_id: fullPR.project_id || null, // Map Project
                        created_by_name: 'ระบบจะกรอกอัตโนมัติ', // This should typically come from auth context
                        status: 'DRAFT',
                        quote_due_date: '', // User must fill
                        
                        // Multicurrency Mapping
                        isMulticurrency: isMulti,
                        currency: fullPR.pr_base_currency_code,
                        target_currency: fullPR.pr_quote_currency_code || 'THB',
                        exchange_rate: fullPR.pr_exchange_rate || 1,
                        exchange_rate_date: fullPR.pr_exchange_rate_date ? fullPR.pr_exchange_rate_date.split('T')[0] : '',

                        payment_terms: '', // Default or from Vendor if selected
                        incoterm: '',
                        remarks: `Generated from PR: ${fullPR.pr_no}`,
                        lines: rfqLines
                    });
                    
                    // Clear any previous errors
                    setErrors({});

                } catch (error) {
                    logger.error('Failed to fetch PR details for RFQ:', error);
                    toast('ไม่สามารถดึงข้อมูล PR ได้', 'error');
                }
            };
            fetchPRDetails();
        } else if (isOpen && !initialPR) {
             // Reset to empty if no PR (Create New standalone)
             setFormData({
                ...initialRFQFormData,
                 rfq_no: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                 lines: Array.from({ length: 5 }, (_, i) => ({
                    ...initialRFQLineFormData,
                    line_no: i + 1,
                })),
            });
            setErrors({});
        }
    }, [isOpen, initialPR, toast]);


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

    const handleRemoveLine = useCallback((index: number) => {
        if (formData.lines.length <= 5) {
            toast('ต้องมีอย่างน้อย 5 แถว', 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })),
        }));
    }, [formData.lines.length, toast]);

    const handleSave = async () => {
        if (!validateForm(formData)) {
            toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // Simulate API save with delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger.log('Save RFQ with Currency:', {
                ...formData
            });

            // Call onSuccess callback (async - updates PR status to COMPLETED)
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

    const handleOpenProductSearch = (index: number) => {
        setActiveRowIndex(index);
        setProductSearchTerm('');
        setIsProductModalOpen(true);
    };

    const handleProductSelect = (product: ItemListItem) => {
        if (activeRowIndex !== null) {
            handleLineChange(activeRowIndex, 'item_code', product.item_code);
            handleLineChange(activeRowIndex, 'item_name', product.item_name);
            handleLineChange(activeRowIndex, 'uom', product.unit_name || '');
        }
        setIsProductModalOpen(false);
        setActiveRowIndex(null);
    };

    const filteredProducts = items.filter(p => 
        p.item_code.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
        p.item_name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    return {
        formData,
        isSaving,
        activeTab,
        setActiveTab,
        branches,
        items,
        units,
        
        isProductModalOpen,
        setIsProductModalOpen,
        productSearchTerm,
        setProductSearchTerm,
        filteredProducts,
        handleChange,
        handleLineChange,
        handleAddLine,
        handleRemoveLine,
        handleSave,
        
        handleOpenProductSearch,
        handleProductSelect,
        errors, 
        validateForm
    };
};
