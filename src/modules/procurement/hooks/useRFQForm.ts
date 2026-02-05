import { useState, useEffect, useRef, useCallback } from 'react';
import { MasterDataService } from '@/core/api/master-data.service';
import type { BranchListItem, ItemListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { RFQFormData, RFQLineFormData } from '@/modules/procurement/types/rfq-types';
import { initialRFQFormData, initialRFQLineFormData } from '@/modules/procurement/types/rfq-types';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import { logger } from '@/shared/utils/logger';

interface VendorSelection {
    vendor_code: string;
    vendor_name: string;
    vendor_name_display: string;
}

export const useRFQForm = (isOpen: boolean, onClose: () => void, initialPR?: PRHeader | null, onSuccess?: () => void) => {
    const prevIsOpenRef = useRef(false);
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

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');
    const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    
    // Vendor Selection State
    const [selectedVendors, setSelectedVendors] = useState<VendorSelection[]>([
        { vendor_code: '', vendor_name: '', vendor_name_display: '' },
        { vendor_code: '', vendor_name: '', vendor_name_display: '' },
        { vendor_code: '', vendor_name: '', vendor_name_display: '' },
    ]);
    const [activeVendorIndex, setActiveVendorIndex] = useState<number | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

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

    // Reset/Prefill Logic
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const timer = setTimeout(() => {
                if (initialPR) {
                    setFormData({
                        ...initialRFQFormData,
                        rfq_no: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
                        rfq_date: new Date().toLocaleDateString('en-CA'),
                        pr_no: initialPR.pr_no,
                        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
                        lines: Array.from({ length: 5 }, (_, i) => ({
                            ...initialRFQLineFormData,
                            line_no: i + 1,
                        })),
                        remarks: `Generated from PR: ${initialPR.pr_no}`
                    });
                } else {
                    setFormData({
                        ...initialRFQFormData,
                        rfq_no: `RFQ2024-007`,
                        rfq_date: new Date().toLocaleDateString('en-CA'),
                        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
                        lines: Array.from({ length: 5 }, (_, i) => ({
                            ...initialRFQLineFormData,
                            line_no: i + 1,
                        })),
                    });
                }
                
                setSelectedVendors([
                    { vendor_code: '', vendor_name: '', vendor_name_display: '' },
                    { vendor_code: '', vendor_name: '', vendor_name_display: '' },
                    { vendor_code: '', vendor_name: '', vendor_name_display: '' },
                ]);
            }, 0);
            return () => clearTimeout(timer);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialPR]);

    const handleChange = useCallback((field: keyof RFQFormData, value: string | number) => {
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
            setAlert({ show: true, message: 'ต้องมีอย่างน้อย 5 แถว' });
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })),
        }));
    }, [formData.lines.length]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger.log('Save RFQ:', formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('Failed to save RFQ:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenVendorModal = (index: number) => {
        setActiveVendorIndex(index);
        setIsVendorModalOpen(true);
    };

    const handleVendorSelect = (vendor: VendorSearchItem) => {
        if (activeVendorIndex !== null) {
            const newVendors = [...selectedVendors];
            newVendors[activeVendorIndex] = {
                vendor_code: vendor.code,
                vendor_name: vendor.name,
                vendor_name_display: `${vendor.code} - ${vendor.name}`,
            };
            setSelectedVendors(newVendors);
        }
        setIsVendorModalOpen(false);
        setActiveVendorIndex(null);
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
        alert,
        setAlert,
        branches,
        items,
        units,
        selectedVendors,
        isVendorModalOpen,
        setIsVendorModalOpen,
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
        handleOpenVendorModal,
        handleVendorSelect,
        handleOpenProductSearch,
        handleProductSelect
    };
};
