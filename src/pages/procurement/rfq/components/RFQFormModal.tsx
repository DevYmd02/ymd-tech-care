/**
 * @file RFQFormModal.tsx
 * @description Modal สร้าง RFQ - ใช้ layout และ dark theme เหมือน PR modal
 * @features full-screen, dark theme, smooth animations, window control buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { RFQFooter } from './RFQFooter';
import { WindowFormLayout } from '../../../../components/shared/WindowFormLayout';
import { SystemAlert } from '../../../../components/shared/SystemAlert';
import { masterDataService } from '../../../../services/masterDataService';
import type { BranchMaster, ItemMaster, UnitMaster } from '../../../../types/master-data-types';
import type { RFQFormData, RFQLineFormData } from '../../../../types/rfq-types';
import { initialRFQFormData, initialRFQLineFormData } from '../../../../types/rfq-types';
import { logger } from '../../../../utils/logger';

// ====================================================================================
// TYPES
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const RFQFormModal: React.FC<Props> = ({ isOpen, onClose }) => {
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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const timer = setTimeout(() => {
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
            }, 0);
            return () => clearTimeout(timer);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

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
            onClose();
        } catch (error) {
            logger.error('Failed to save RFQ:', error);
        } finally {
            setIsSaving(false);
        }
    };

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
                                            <select
                                            value={line.item_code}
                                            onChange={(e) => {
                                                const selectedItem = items.find(i => i.item_code === e.target.value);
                                                if (selectedItem) {
                                                    handleLineChange(index, 'item_code', selectedItem.item_code);
                                                    handleLineChange(index, 'item_name', selectedItem.item_name);
                                                    handleLineChange(index, 'uom', selectedItem.unit_name || '');
                                                }
                                            }}
                                            className={selectStyle}
                                        >
                                            <option value="">เลือกสินค้า</option>
                                            {items.map(item => (
                                                <option key={item.item_id} value={item.item_code}>
                                                    {item.item_code} - {item.item_name}
                                                </option>
                                            ))}
                                        </select>
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
                                            <option value="">หน่วยนับ</option>
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
        </WindowFormLayout>
    );
};

// Named export for backward compatibility
export { RFQFormModal as default };
