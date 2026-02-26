import { useState, useMemo, useEffect, useRef } from 'react';
import { Save, Package, Plus, Trash2, Search } from 'lucide-react';
import { WindowFormLayout, DialogFormLayout } from '@ui';
import { POService } from '@/modules/procurement/services';
import { GRNService } from '@/modules/procurement/services/grn.service';
import type { POListItem } from '@/modules/procurement/types';
import type { CreateGRNPayload, GRNLineItemInput } from '@/modules/procurement/types/grn-types';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialPOId?: string;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function GRNFormModal({ isOpen, onClose, onSuccess, initialPOId }: Props) {
    const prevIsOpenRef = useRef(false);
    
    // -- State --
    const [grnNo] = useState<string>('GRN2024-xxx');
    const [selectedPOId, setSelectedPOId] = useState<string>('');
    const [selectedPO, setSelectedPO] = useState<POListItem | null>(null);
    const [items, setItems] = useState<GRNLineItemInput[]>([]);
    const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [remark, setRemark] = useState<string>('');
    const [warehouseId, setWarehouseId] = useState<string>('');
    const [receivedBy, setReceivedBy] = useState<string>('');
    const [status, setStatus] = useState<string>('Draft');
    const [isPOSearchOpen, setIsPOSearchOpen] = useState(false);

    // -- Fetch Issued POs --
    const [poList, setPoList] = useState<POListItem[]>([]);
    
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            // Reset form
            setSelectedPOId(initialPOId || '');
            setSelectedPO(null);
            setItems([]);
            setFormDate(new Date().toISOString().split('T')[0]);
            setRemark('');
            setWarehouseId('');
            setReceivedBy('');
            setStatus('Draft');
            
            // Load POs
            POService.getList({ status: 'ISSUED', limit: 100 }).then(res => {
                setPoList(res.data);
            });
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialPOId]);

    // -- Handle PO Selection --
    useEffect(() => {
        if (selectedPOId) {
            POService.getById(selectedPOId).then(po => {
                if (po) {
                    setSelectedPO(po);
                    const mockItems: GRNLineItemInput[] = Array.from({ length: po.item_count || 2 }).map((_, i) => ({
                        po_line_id: `pol-${i}`,
                        item_id: `item-${i}`,
                        item_code: `ITM00${i+1}`,
                        item_name: `คอมพิวเตอร์ Notebook Dell Ins`,
                        qty_ordered: 5 * (i + 1),
                        receiving_qty: 5 * (i + 1),
                        accepted_qty: 5 * (i + 1),
                        rejected_qty: 0,
                        uom_name: 'PCS',
                        unit_price: 100,
                        line_total: 500 * (i + 1),
                        qc_status: 'PASS',
                        remark: ''
                    }));
                    setItems(mockItems);
                }
            });
        } else {
            setSelectedPO(null);
            setItems([]);
        }
    }, [selectedPOId]);

    // -- Handlers --
    const handleQuantityChange = (index: number, value: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            item.receiving_qty = value;
            item.accepted_qty = value;
            item.rejected_qty = 0;
            newItems[index] = item;
            return newItems;
        });
    };

    const handleQCStatusChange = (index: number, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], qc_status: value };
            return newItems;
        });
    };

    const handleRemarkChange = (index: number, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], remark: value };
            return newItems;
        });
    };

    const handleAddLine = () => {
        setItems(prev => [...prev, {
            po_line_id: `pol-new-${Date.now()}`,
            item_id: '',
            item_code: '',
            item_name: '',
            qty_ordered: 0,
            receiving_qty: 0,
            accepted_qty: 0,
            rejected_qty: 0,
            uom_name: 'PCS',
            unit_price: 0,
            line_total: 0,
            qc_status: 'PASS',
            remark: ''
        }]);
    };

    const handleRemoveLine = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedPOId) return;
        
        const payload: CreateGRNPayload = {
             po_id: selectedPOId,
             received_date: formDate,
             warehouse_id: warehouseId || selectedPO?.ship_to_warehouse_id || 'wh-default',
             remark: remark,
             items: items.map(i => ({
                 po_line_id: i.po_line_id || 'unknown-pol',
                 item_id: i.item_id || 'unknown-item',
                 receiving_qty: i.receiving_qty,
                 accepted_qty: i.accepted_qty,
                 rejected_qty: i.rejected_qty,
                 remark: i.remark
             }))
        };

        try {
            await GRNService.create(payload);
            window.alert('บันทึกใบรับสินค้าเรียบร้อยแล้ว');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('[GRNFormModal] handleSubmit error:', error);
            window.alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // -- Calculated Values --
    const totalItems = items.length;
    const totalReceived = useMemo(() => items.reduce((sum, item) => sum + (item.receiving_qty || 0), 0), [items]);

    // -- Styles --
    const inputClass = 'w-full h-10 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    const selectClass = 'w-full h-10 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none';
    const labelClass = 'block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1';
    const sectionHeaderClass = 'text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2';

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบรับสินค้าใหม่ (Create GRN)"
            titleIcon={<div className="bg-blue-500 p-2 rounded-lg shadow"><Package className="text-white" size={20} /></div>}
            headerColor="bg-gradient-to-r from-blue-600 to-blue-500 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10">
                    <div className="text-xs text-red-500">* ฟิลด์ที่จำเป็นต้องกรอก</div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedPOId}
                            className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={18} />
                            บันทึก
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 p-4 gap-4 overflow-auto">
                
                {/* ========== GRN Header Section ========== */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className={sectionHeaderClass}>
                        <Package size={18} />
                        ใบรับสินค้า (GRN Header)
                    </h3>
                    
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className={labelClass}>
                                เลขที่ GRN <span className="text-gray-400">(grn_no)</span> <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={grnNo} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-900`} />
                        </div>
                        <div>
                            <label className={labelClass}>
                                วันที่รับ <span className="text-gray-400">(grn_date)</span> <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>
                                เลขที่ PO อ้างอิง <span className="text-gray-400">(po_id FK)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={selectedPO?.po_no || 'PO2024-xxx'} 
                                    readOnly 
                                    className={`${inputClass} flex-1 bg-gray-50 dark:bg-gray-900`}
                                    placeholder="PO2024-xxx"
                                />
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsPOSearchOpen(true);
                                    }}
                                    className="px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className={labelClass}>
                                รับเข้าคลัง <span className="text-gray-400">(warehouse_id FK)</span> <span className="text-red-500">*</span>
                            </label>
                            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectClass}>
                                <option value="">-- เลือกคลังสินค้า --</option>
                                <option value="wh-1">คลังสินค้าหลัก</option>
                                <option value="wh-2">คลังสินค้าสาขา</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                ผู้รับสินค้า <span className="text-gray-400">(received_by)</span> <span className="text-red-500">*</span>
                            </label>
                            <select value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={selectClass}>
                                <option value="">-- เลือกผู้รับสินค้า --</option>
                                <option value="user-1">สมชาย ใจดี</option>
                                <option value="user-2">สมหญิง รักดี</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                สถานะ <span className="text-gray-400">(status)</span>
                            </label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                                <option value="Draft">Draft</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="mt-4">
                        <label className={labelClass}>
                            หมายเหตุ <span className="text-gray-400">(remarks - optional)</span>
                        </label>
                        <textarea 
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                            rows={2}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                {/* ========== Line Items Section ========== */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={sectionHeaderClass}>
                            รายการสินค้าที่รับ (GRN Line Items)
                        </h3>
                        <button 
                            type="button"
                            onClick={handleAddLine}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} />
                            เพิ่มรายการ
                        </button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-3 text-center w-12 border-b border-r border-gray-200 dark:border-gray-700">#</th>
                                    <th className="px-3 py-3 text-left w-28 border-b border-r border-gray-200 dark:border-gray-700">
                                        รหัสสินค้า<br/><span className="text-xs text-gray-400">(item_id FK)</span>
                                    </th>
                                    <th className="px-3 py-3 text-left border-b border-r border-gray-200 dark:border-gray-700">ชื่อสินค้า</th>
                                    <th className="px-3 py-3 text-center w-24 border-b border-r border-gray-200 dark:border-gray-700">
                                        จำนวนสั่ง<br/><span className="text-xs text-gray-400">(PO Qty)</span>
                                    </th>
                                    <th className="px-3 py-3 text-center w-24 border-b border-r border-gray-200 dark:border-gray-700">
                                        จำนวนรับ<br/><span className="text-xs text-gray-400">(qty_received)*</span>
                                    </th>
                                    <th className="px-3 py-3 text-center w-20 border-b border-r border-gray-200 dark:border-gray-700">
                                        หน่วย<br/><span className="text-xs text-gray-400">(uom_id FK)</span>
                                    </th>
                                    <th className="px-3 py-3 text-center w-24 border-b border-r border-gray-200 dark:border-gray-700">
                                        สถานะ QC<br/><span className="text-xs text-gray-400">(qc_status)</span>
                                    </th>
                                    <th className="px-3 py-3 text-left w-32 border-b border-r border-gray-200 dark:border-gray-700">
                                        หมายเหตุ<br/><span className="text-xs text-gray-400">(remarks)</span>
                                    </th>
                                    <th className="px-3 py-3 text-center w-12 border-b border-gray-200 dark:border-gray-700">ลบ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {items.map((item, index) => (
                                    <tr key={item.po_line_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-3 py-2 text-center text-gray-500 border-r border-gray-100 dark:border-gray-700">{index + 1}</td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <input type="text" value={item.item_code} readOnly className="w-full h-8 px-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <input type="text" value={item.item_name} readOnly className="w-full h-8 px-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                                        </td>
                                        <td className="px-3 py-2 text-center border-r border-gray-100 dark:border-gray-700">
                                            <input type="number" value={item.qty_ordered} readOnly className="w-full h-8 px-2 text-sm text-center border border-gray-200 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <input 
                                                type="number" 
                                                min={0}
                                                value={item.receiving_qty} 
                                                onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                                                className="w-full h-8 px-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <select value={item.uom_name} className="w-full h-8 px-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="SET">SET</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <select 
                                                value={item.qc_status || 'PASS'} 
                                                onChange={(e) => handleQCStatusChange(index, e.target.value)}
                                                className="w-full h-8 px-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            >
                                                <option value="PASS">PASS</option>
                                                <option value="FAIL">FAIL</option>
                                                <option value="PENDING">PENDING</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-700">
                                            <input 
                                                type="text" 
                                                value={item.remark || ''} 
                                                onChange={(e) => handleRemarkChange(index, e.target.value)}
                                                placeholder="หมายเหตุ"
                                                className="w-full h-8 px-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveLine(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                                            กรุณาเลือก PO เพื่อแสดงรายการสินค้า หรือกดปุ่ม "เพิ่มรายการ"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-4 flex justify-end">
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-72">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">จำนวนรายการทั้งหมด:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{totalItems} รายการ</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">จำนวนรับรวม:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* PO Search Modal */}
            <DialogFormLayout
                isOpen={isPOSearchOpen}
                onClose={() => setIsPOSearchOpen(false)}
                title="เลือกใบสั่งซื้อ (Select PO)"
                titleIcon={<Search size={20} />}
                width="max-w-4xl"
            >
                <div className="p-4 flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-4 py-2 rounded-tl-lg">PO No.</th>
                                <th className="px-4 py-2">Vendor</th>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {poList.length > 0 ? (
                                poList.map(po => (
                                    <tr key={po.po_id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{po.po_no}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{po.vendor_name}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{po.po_date || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedPOId(po.po_id);
                                                    setIsPOSearchOpen(false);
                                                }}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                            >
                                                เลือก
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        ไม่พบข้อมูลใบสั่งซื้อ
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={() => setIsPOSearchOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        ปิด
                    </button>
                </div>
            </DialogFormLayout>
        </WindowFormLayout>
    );
}

