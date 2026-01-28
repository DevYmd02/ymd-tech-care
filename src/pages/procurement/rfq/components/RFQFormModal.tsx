/**
 * @file RFQFormModal.tsx
 * @description Modal สร้าง RFQ - ใช้ layout และ dark theme เหมือน PR modal
 * @features full-screen, dark theme, smooth animations, window control buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Info, MoreHorizontal, Star, AlignLeft, History, Search, Users } from 'lucide-react';
import { RFQFooter } from './RFQFooter';
import { WindowFormLayout, TabPanel, VendorSearchModal } from '../../../../components/shared';
import { SystemAlert } from '../../../../components/shared/SystemAlert';
import { masterDataService } from '../../../../services/masterDataService';
import { vendorService } from '../../../../services/vendorService';
import type { BranchMaster, ItemMaster, UnitMaster } from '../../../../types/master-data-types';
import type { RFQFormData, RFQLineFormData } from '../../../../types/rfq-types';
import { initialRFQFormData, initialRFQLineFormData } from '../../../../types/rfq-types';
import type { VendorSearchItem } from '../../../../types/vendor-types';
import { logger } from '../../../../utils/logger';
import type { PRHeader } from '../../../../types/pr-types';

// ====================================================================================
// TYPES
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: string | null;
    initialPR?: PRHeader | null; // Add initialPR prop
}

interface VendorSelection {
    vendor_code: string;
    vendor_name: string;
    vendor_name_display: string;
    tax_id?: string;
    address?: string;
    payment_term_days?: number;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const RFQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialPR }) => {
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
    
    // Vendor Selection State
    const [selectedVendors, setSelectedVendors] = useState<VendorSelection[]>([
        { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
        { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
        { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
    ]);
    const [activeVendorIndex, setActiveVendorIndex] = useState<number | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

    // Tab configuration
    const tabs = [
        { id: 'detail', label: 'Detail', icon: <Info size={16} /> },
        { id: 'more', label: 'More', icon: <MoreHorizontal size={16} /> },
        { id: 'rate', label: 'Rate', icon: <Star size={16} /> },
        { id: 'description', label: 'Description', icon: <AlignLeft size={16} /> },
        { id: 'history', label: 'History', icon: <History size={16} /> },
    ];



    // Master Data State
    const [branches, setBranches] = useState<BranchMaster[]>([]);
    const [items, setItems] = useState<ItemMaster[]>([]);
    const [units, setUnits] = useState<UnitMaster[]>([]);

    // Fetch Master Data
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [branchesData, itemsData, unitsData] = await Promise.all([
                    masterDataService.getBranches(),
                    masterDataService.getItems(),
                    masterDataService.getUnits()
                ]);
                setBranches(branchesData);
                setItems(itemsData);
                setUnits(unitsData);
            } catch (error) {
                logger.error('Failed to fetch master data:', error);
            }
        };
        fetchMasterData();
    }, []);

    // Reset form when modal opens or initialPR changes
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
             const timer = setTimeout(() => {
                // If there's an initial PR, pre-fill the form
                if (initialPR) {
                     setFormData({
                        ...initialRFQFormData,
                        rfq_no: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`, // Mock RFQ No
                        rfq_date: new Date().toLocaleDateString('en-CA'),
                        pr_no: initialPR.pr_no, // Pre-fill PR No
                        created_by_name: 'ระบบจะกรอกอัตโนมัติ',
                        // Map lines from PR if available (MockPRItem currently doesn't have detailed lines in the interface used in PRListPage interaction, strictly speaking, but we can assume structure or default)
                        // For now we just keep default lines or if we had PR lines we would map them.
                        // Since MockPRItem in the list is a summary, we might not have lines. 
                        // But if we did fetch full PR details, we would map here.
                        // Let's just set default lines for now as requested by user context "to pre-fill or set initial data".
                        lines: Array.from({ length: 5 }, (_, i) => ({
                            ...initialRFQLineFormData,
                            line_no: i + 1,
                        })),
                        remarks: `Generated from PR: ${initialPR.pr_no}`
                    });
                } else {
                    // Default logic
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
                    { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
                    { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
                    { vendor_code: '', vendor_name: '', vendor_name_display: '', tax_id: '', address: '', payment_term_days: undefined },
                ]);
            }, 0);
            return () => clearTimeout(timer);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialPR]);

    // if (!isOpen && !isClosing) return null; // Handled by WindowFormLayout

    // Alert State
    const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    // Handlers
    const handleChange = (field: keyof RFQFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLineChange = (index: number, field: keyof RFQLineFormData, value: string | number) => {
        setFormData(prev => {
            const newLines = [...prev.lines];
            newLines[index] = { ...newLines[index], [field]: value };
            return { ...prev, lines: newLines };
        });
    };

    const handleAddLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { ...initialRFQLineFormData, line_no: prev.lines.length + 1 }],
        }));
    };

    const handleRemoveLine = (index: number) => {
        if (formData.lines.length <= 5) {
            setAlert({ show: true, message: 'ต้องมีอย่างน้อย 5 แถว' });
            return;
        }
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index).map((line, i) => ({ ...line, line_no: i + 1 })),
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            logger.log('Save RFQ:', formData);
            logger.log('Selected Vendors:', selectedVendors);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('Failed to save RFQ:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Vendor Selection Handlers
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

    // Product Search Handlers
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const handleOpenProductSearch = (index: number) => {
        setActiveRowIndex(index);
        setProductSearchTerm('');
        setIsProductModalOpen(true);
    };

    const handleProductSelect = (product: ItemMaster) => {
        if (activeRowIndex !== null) {
            handleLineChange(activeRowIndex, 'item_code', product.item_code);
            handleLineChange(activeRowIndex, 'item_name', product.item_name);
            handleLineChange(activeRowIndex, 'uom', product.unit_name || '');
        }
        setIsProductModalOpen(false);
        setActiveRowIndex(null);
    };

    // Filter products for search
    const filteredProducts = items.filter(p => 
        p.item_code.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
        p.item_name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    // Shared styles (same as PR modal)
    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";
    const selectStyle = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white";
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const hintStyle = "text-xs text-gray-400 dark:text-gray-500 mt-1";

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบขอเสนอราคา (RFQ) - Request for Quotation"
            titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
            headerColor="bg-teal-600"
            footer={<RFQFooter onSave={handleSave} onClose={onClose} isSaving={isSaving} />}
        >
            {/* System Alert */}
            {alert.show && (
                <SystemAlert 
                    message={alert.message} 
                    onClose={() => setAlert({ ...alert, show: false })} 
                />
            )}

            <div className={cardClass}>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                        <FileText size={18} />
                        <span className="font-semibold">ส่วนหัวเอกสาร - Header RFQ (Request for Quotation)</span>
                    </div>

                    {/* Row 1: เลขที่ RFQ, วันที่สร้าง, PR ต้นทาง */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>เลขที่ RFQ <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.rfq_no}
                                readOnly
                                className={inputStyle}
                            />
                            <p className={hintStyle}>เลขที่เอกสาร RFQ (Running จาก sequence_running)</p>
                        </div>
                        <div>
                            <label className={labelStyle}>วันที่สร้าง RFQ <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={formData.rfq_date}
                                onChange={(e) => handleChange('rfq_date', e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                        <div>
                            <label className={labelStyle}>PR ต้นทาง <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="PR2024-xxx"
                                    value={formData.pr_no || ''}
                                    onChange={(e) => handleChange('pr_no', e.target.value)}
                                    className={inputStyle}
                                />
                                <button className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm">
                                    เลือก
                                </button>
                            </div>
                            <p className={hintStyle}>อ้างถึง pr_header.pr_id (PR ต้นทาง)</p>
                        </div>
                    </div>

                    {/* Row 2: สาขา, ผู้สร้าง, สถานะ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>สาขาที่สร้าง RFQ</label>
                            <select 
                                value={formData.branch_id || ''} 
                                onChange={(e) => handleChange('branch_id', e.target.value)}
                                className={selectStyle}
                            >
                                <option value="">เลือกสาขา</option>
                                {branches.map(branch => (
                                    <option key={branch.branch_id} value={branch.branch_id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>ผู้สร้าง RFQ</label>
                            <input
                                type="text"
                                value="ระบบจะกรอกอัตโนมัติ"
                                readOnly
                                className={`${inputStyle} bg-gray-200 dark:bg-gray-700`}
                            />
                        </div>
                        <div>
                            <label className={labelStyle}>สถานะ <span className="text-red-500">*</span></label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className={selectStyle}
                            >
                                <option value="DRAFT">DRAFT - แบบร่าง</option>
                                <option value="SENT">SENT - ส่งแล้ว</option>
                                <option value="CLOSED">CLOSED - ปิดแล้ว</option>
                                <option value="CANCELLED">CANCELLED - ยกเลิก</option>
                            </select>
                            <p className={hintStyle}>สถานะ: DRAFT/SENT/CLOSED/CANCELLED</p>
                        </div>
                    </div>

                    {/* Row 3: ใช้ได้ถึงวันที่, สกุลเงิน, อัตราแลกเปลี่ยน */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>ใช้ได้ถึงวันที่ <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={formData.quote_due_date}
                                onChange={(e) => handleChange('quote_due_date', e.target.value)}
                                className={inputStyle}
                            />
                            <p className={hintStyle}>วันหมดอายุการเสนอราคา</p>
                        </div>
                        <div>
                            <label className={labelStyle}>สกุลเงิน</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className={selectStyle}
                            >
                                <option value="THB">THB - บาท</option>
                                <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                <option value="EUR">EUR - ยูโร</option>
                            </select>
                            <p className={hintStyle}>สกุลเงิน (ค่าเริ่มต้น THB)</p>
                        </div>
                        <div>
                            <label className={labelStyle}>อัตราแลกเปลี่ยน</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.exchange_rate}
                                onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value) || 1)}
                                className={inputStyle}
                            />
                            <p className={hintStyle}>อัตราแลกเปลี่ยน (ค่า 1)</p>
                        </div>
                    </div>

                    {/* Row 4: สถานที่จัดส่ง, เงื่อนไขการชำระ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelStyle}>สถานที่จัดส่ง/ส่งมอบ</label>
                            <input
                                type="text"
                                placeholder="ระบุสถานที่ส่งมอบ"
                                value={formData.delivery_location}
                                onChange={(e) => handleChange('delivery_location', e.target.value)}
                                className={inputStyle}
                            />
                            <p className={hintStyle}>สถานที่จัดส่ง/ส่งมอบ (ถ้ามีให้กรณีประเมินราคาค่าขนส่ง)</p>
                        </div>
                        <div>
                            <label className={labelStyle}>เงื่อนไขการชำระ</label>
                            <input
                                type="text"
                                placeholder="เช่น Net 30"
                                value={formData.payment_terms}
                                onChange={(e) => handleChange('payment_terms', e.target.value)}
                                className={inputStyle}
                            />
                            <p className={hintStyle}>แนวทางเงื่อนไขที่ต้องการ (เช่น Net 30)</p>
                        </div>
                    </div>

                    {/* Row 5: เงื่อนไขส่งมอบ, หมายเหตุ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>เงื่อนไขส่งมอบ (Incoterm)</label>
                            <input
                                type="text"
                                placeholder="FOB, CIF, EXW, etc."
                                value={formData.incoterm}
                                onChange={(e) => handleChange('incoterm', e.target.value)}
                                className={inputStyle}
                            />
                            <p className={hintStyle}>เงื่อนไขส่งมอบ (กรณีต่างประเทศ)</p>
                        </div>
                        <div>
                            <label className={labelStyle}>หมายเหตุเพิ่มเติม</label>
                            <textarea
                                placeholder="ระบุหมายเหตุ..."
                                value={formData.remarks}
                                onChange={(e) => handleChange('remarks', e.target.value)}
                                rows={2}
                                className={`${inputStyle} h-auto resize-none`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== LINE ITEMS SECTION ===== */}
            <div className={cardClass}>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                        <FileText size={18} />
                        <span className="font-semibold">รายการสินค้า - Line RFQ (Request for Quotation)</span>
                    </div>

                    {/* Lines Table */}
                    <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <table className="w-full min-w-[900px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                            <thead className="bg-purple-600 text-white text-xs">
                                <tr>
                                    <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-14">ลำดับ</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-36">รหัสสินค้า</th>
                                    <th className="px-3 py-2 text-left font-medium border-r border-purple-500">รายละเอียด</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-20">จำนวน</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-24">หน่วย</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-purple-500 w-32">วันที่ต้องการ</th>
                                    <th className="px-3 py-2 text-left font-medium border-r border-purple-500 w-32">หมายเหตุ</th>
                                    <th className="px-3 py-2 text-center font-medium w-20">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.lines.map((line, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-3 py-1.5 text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 font-medium border-r border-gray-200 dark:border-gray-700">
                                            {line.line_no}
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={line.item_code}
                                                    onChange={(e) => handleLineChange(index, 'item_code', e.target.value)}
                                                    className={`${inputStyle} text-center`}
                                                    placeholder="รหัสสินค้า"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenProductSearch(index)}
                                                    className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors shadow-sm"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <input
                                                type="text"
                                                placeholder="รายละเอียดสินค้า"
                                                value={line.item_description}
                                                onChange={(e) => handleLineChange(index, 'item_description', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <input
                                                type="number"
                                                min="0"
                                                value={line.required_qty || 0}
                                                onChange={(e) => handleLineChange(index, 'required_qty', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <select
                                            value={line.uom}
                                            onChange={(e) => handleLineChange(index, 'uom', e.target.value)}
                                            className={selectStyle}
                                        >
                                            <option value="">เลือก</option>
                                            <option value="เครื่อง">เครื่อง</option>
                                            <option value="ชิ้น">ชิ้น</option>
                                            <option value="กล่อง">กล่อง</option>
                                            <option value="ลัง">ลัง</option>
                                            <option value="กก.">กก.</option>
                                            {units.map(unit => (
                                                <option key={unit.unit_id} value={unit.unit_name}>
                                                    {unit.unit_name}
                                                </option>
                                            ))}
                                        </select>
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <input
                                                type="date"
                                                value={line.required_date}
                                                onChange={(e) => handleLineChange(index, 'required_date', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-400"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                            <input
                                                type="text"
                                                placeholder="หมายเหตุ"
                                                value={line.remarks}
                                                onChange={(e) => handleLineChange(index, 'remarks', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                            />
                                        </td>
                                        <td className="px-1 py-1 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={handleAddLine}
                                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLine(index)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ===== VENDOR SELECTION SECTION ===== */}
            <div className={cardClass}>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                        <Users size={18} />
                        <span className="font-semibold">เลือกผู้ขาย - Vendor Selection for RFQ</span>
                    </div>

                    <div className="space-y-4">
                        {selectedVendors.map((vendor, index) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Tax ID Search - Purple Button */}
                                    <div>
                                        <label className={labelStyle}>เลขประจำตัวผู้เสียภาษี (Tax ID) {index + 1}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="0105562012345"
                                                value={vendor.tax_id || ''}
                                                onChange={(e) => {
                                                    const newVendors = [...selectedVendors];
                                                    newVendors[index] = { ...newVendors[index], tax_id: e.target.value };
                                                    setSelectedVendors(newVendors);
                                                }}
                                                className={`${inputStyle} flex-1 font-mono`}
                                            />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const taxId = vendor.tax_id;
                                                    if (!taxId) {
                                                        setAlert({ show: true, message: 'กรุณากรอกเลขผู้เสียภาษีก่อนค้นหา' });
                                                        return;
                                                    }
                                                    try {
                                                        const result = await vendorService.getByTaxId(taxId);
                                                        if (result) {
                                                            const newVendors = [...selectedVendors];
                                                            newVendors[index] = {
                                                                ...newVendors[index],
                                                                vendor_code: result.vendor_code,
                                                                vendor_name: result.vendor_name,
                                                                vendor_name_display: `${result.vendor_code} - ${result.vendor_name}`,
                                                                tax_id: result.tax_id || '',
                                                                address: result.address_line1 || '',
                                                                payment_term_days: result.payment_term_days || 30,
                                                            };
                                                            setSelectedVendors(newVendors);
                                                        } else {
                                                            setAlert({ show: true, message: `ไม่พบผู้ขายที่มีเลขผู้เสียภาษี: ${taxId}` });
                                                        }
                                                    } catch {
                                                        setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการค้นหา' });
                                                    }
                                                }}
                                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shrink-0 font-medium text-sm flex items-center gap-2 shadow-sm"
                                            >
                                                <Search size={16} />
                                                ค้นหา
                                            </button>
                                        </div>
                                        <p className={hintStyle}>กรอกเลข 13 หลัก แล้วกด "ค้นหา"</p>
                                    </div>

                                    {/* Vendor Code */}
                                    <div>
                                        <label className={labelStyle}>รหัสผู้ขาย</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="รหัสผู้ขาย"
                                                value={vendor.vendor_code}
                                                readOnly
                                                className={`${inputStyle} flex-1 bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleOpenVendorModal(index)}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm flex items-center gap-2"
                                            >
                                                <Users size={16} />
                                                เลือก
                                            </button>
                                        </div>
                                    </div>

                                    {/* Vendor Name */}
                                    <div>
                                        <label className={labelStyle}>ชื่อผู้ขาย</label>
                                        <input
                                            type="text"
                                            placeholder="ชื่อผู้ขายจะแสดงอัตโนมัติ"
                                            value={vendor.vendor_name_display}
                                            readOnly
                                            className={`${inputStyle} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                                        />
                                    </div>

                                    {/* Payment Terms */}
                                    <div>
                                        <label className={labelStyle}>เครดิต (วัน)</label>
                                        <input
                                            type="number"
                                            placeholder="30"
                                            value={vendor.payment_term_days || ''}
                                            readOnly
                                            className={`${inputStyle} bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-center`}
                                        />
                                    </div>
                                </div>

                                {/* Address Row - Shows after search */}
                                {vendor.address && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <label className={labelStyle}>ที่อยู่</label>
                                        <input
                                            type="text"
                                            value={vendor.address}
                                            readOnly
                                            className={`${inputStyle} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Panel Section */}
            <div className={cardClass}>
                <div className="p-4">
                    <TabPanel
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        variant="underline"
                    >
                        {activeTab === 'detail' && (
                            <div className="space-y-3">
                                <textarea
                                    placeholder="กรอกหมายเหตุเพิ่มเติม..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white resize-none"
                                    value={formData.remarks}
                                    onChange={(e) => handleChange('remarks', e.target.value)}
                                />
                            </div>
                        )}
                        {activeTab === 'more' && (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                ข้อมูลเพิ่มเติม (พร้อมใช้งานเร็วๆ นี้)
                            </div>
                        )}
                        {activeTab === 'rate' && (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                ข้อมูลอัตราแลกเปลี่ยน (พร้อมใช้งานเร็วๆ นี้)
                            </div>
                        )}
                        {activeTab === 'description' && (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                รายละเอียดเพิ่มเติม (พร้อมใช้งานเร็วๆ นี้)
                            </div>
                        )}
                        {activeTab === 'history' && (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                ประวัติการเปลี่ยนแปลง (พร้อมใช้งานเร็วๆ นี้)
                            </div>
                        )}
                    </TabPanel>
                </div>
            </div>

            {/* Product Search Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setIsProductModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Search className="text-teal-600" />
                                        ค้นหาสินค้า
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">เลือกสินค้าที่ต้องการเพิ่มในรายการ</p>
                                </div>
                                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="text-2xl">×</span>
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    value={productSearchTerm} 
                                    onChange={(e) => setProductSearchTerm(e.target.value)} 
                                    placeholder="ค้นหาด้วยรหัส หรือชื่อสินค้า..." 
                                    className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                                    autoFocus 
                                />
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                    <tr className="text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 font-semibold w-24 text-center">เลือก</th>
                                        <th className="px-4 py-3 font-semibold w-32">รหัสสินค้า</th>
                                        <th className="px-4 py-3 font-semibold">ชื่อสินค้า</th>
                                        <th className="px-4 py-3 font-semibold w-24 text-center">หน่วย</th>
                                        <th className="px-4 py-3 font-semibold w-24 text-right">ราคา</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((item) => (
                                            <tr key={item.item_id} className="hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => handleProductSelect(item)} 
                                                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                                                    >
                                                        เลือก
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-teal-600 dark:text-teal-400">{item.item_code}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.item_name}</td>
                                                <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{item.unit_name}</td>
                                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">0.00</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                ไม่พบข้อมูลสินค้า
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor Search Modal */}
            <VendorSearchModal
                isOpen={isVendorModalOpen}
                onClose={() => {
                    setIsVendorModalOpen(false);
                    setActiveVendorIndex(null);
                }}
                onSelect={handleVendorSelect}
            />
        </WindowFormLayout>
    );
};

// Named export for backward compatibility
export { RFQFormModal as default };
