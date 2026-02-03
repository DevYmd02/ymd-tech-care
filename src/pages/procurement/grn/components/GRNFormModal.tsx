import { useState, useMemo, useEffect, useRef } from 'react';
import { Save, Package, AlertCircle } from 'lucide-react';
import { WindowFormLayout } from '@layout/WindowFormLayout';
import { POService } from '@/services/procurement/po.service';
import { GRNService } from '@/services/procurement/grn.service';
import type { POListItem } from '@/types/po-types';
import type { CreateGRNPayload, GRNLineItemInput } from '@/types/grn-types';
import { SmartTable } from '@ui/SmartTable';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

// ====================================================================================
// INTERNAL HELPERS
// ====================================================================================

const columnHelper = createColumnHelper<GRNLineItemInput>();

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function GRNFormModal({ isOpen, onClose, onSuccess }: Props) {
    const prevIsOpenRef = useRef(false);
    
    // -- State --
    const [selectedPOId, setSelectedPOId] = useState<string>('');
    const [selectedPO, setSelectedPO] = useState<POListItem | null>(null);
    const [items, setItems] = useState<GRNLineItemInput[]>([]);
    const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [remark, setRemark] = useState<string>('');

    // -- Fetch Issued POs --
    const [poList, setPoList] = useState<POListItem[]>([]);
    
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            // Reset form
            setSelectedPOId('');
            setSelectedPO(null);
            setItems([]);
            setFormDate(new Date().toISOString().split('T')[0]);
            setRemark('');
            
            // Load POs
            POService.getList({ status: 'ISSUED', limit: 100 }).then(res => {
                setPoList(res.data);
            });
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

    // -- Handle PO Selection --
    useEffect(() => {
        if (selectedPOId) {
            POService.getById(selectedPOId).then(po => {
                if (po) {
                    setSelectedPO(po);
                    // Mock items from PO (since getById might not return lines in this mock setup)
                    // In real app, we would use po.lines or fetch lines
                    const mockItems: GRNLineItemInput[] = Array.from({ length: po.item_count || 2 }).map((_, i) => ({
                        po_line_id: `pol-${i}`, // Mock ID
                        item_id: `item-${i}`,   // Mock ID
                        item_code: `ITEM-${i+1}`,
                        item_name: `Product Item ${i+1}`,
                        qty_ordered: 10 * (i + 1),
                        receiving_qty: 10 * (i + 1), // Default to full
                        accepted_qty: 10 * (i + 1), // Default to full
                        rejected_qty: 0,
                        uom_name: 'PCS',
                        unit_price: 100,
                        line_total: 1000 * (i + 1),
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
    const handleQuantityChange = (index: number, field: 'receiving_qty' | 'accepted_qty', value: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            
            if (field === 'receiving_qty') {
                item.receiving_qty = value;
                // Clamp accepted to be <= receiving
                if (item.accepted_qty > value) item.accepted_qty = value;
            } else {
                item.accepted_qty = value;
            }

            // Recalculate rejected
            item.rejected_qty = Math.max(0, item.receiving_qty - item.accepted_qty);
            newItems[index] = item;
            return newItems;
        });
    };

    const handleSubmit = async () => {
        if (!selectedPOId) return;
        
        const payload: CreateGRNPayload = {
             po_id: selectedPOId,
             received_date: formDate,
             warehouse_id: selectedPO?.ship_to_warehouse_id || 'wh-default',
             remark: remark,
             items: items.map(i => ({
                 po_line_id: i.po_line_id || 'unknown-pol', // Fallback
                 item_id: i.item_id || 'unknown-item',     // Fallback
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
            console.error(error);
            window.alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // -- Columns --

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = useMemo<ColumnDef<GRNLineItemInput, any>[]>(() => [
        columnHelper.accessor('item_code', {
            header: 'รหัสสินค้า',
            cell: info => info.getValue(),
            size: 100,
        }),
        columnHelper.accessor('item_name', {
            header: 'ชื่อสินค้า',
            cell: info => info.getValue(),
            size: 200,
        }),
        columnHelper.accessor('receiving_qty', { // Using receiving_qty as proxy for ordered display
            header: 'สั่งซื้อ',
            cell: info => <span className="font-semibold text-gray-500">{info.row.original.receiving_qty}</span>,
            size: 80,
            id: 'ordered_qty_display' // Unique ID
        }),
        columnHelper.accessor('receiving_qty', {
            header: 'รับจริง',
            cell: ({ row, getValue }) => (
                <input 
                    type="number" 
                    min={0}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-right bg-white dark:bg-gray-800 dark:border-gray-700"
                    value={getValue()}
                    onChange={e => handleQuantityChange(row.index, 'receiving_qty', Number(e.target.value))}
                />
            ),
            size: 100,
            id: 'receiving_qty_input' // Unique ID
        }),
        columnHelper.accessor('accepted_qty', {
            header: 'ผ่าน',
            cell: ({ row, getValue }) => (
                <input 
                    type="number" 
                    min={0}
                    max={row.original.receiving_qty}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 outline-none text-right text-green-700 font-medium bg-white dark:bg-gray-800 dark:border-gray-700"
                    value={getValue()}
                    onChange={e => handleQuantityChange(row.index, 'accepted_qty', Number(e.target.value))}
                />
            ),
            size: 100,
        }),
        columnHelper.accessor('rejected_qty', {
            header: 'ไม่ผ่าน',
            cell: info => <span className="text-red-600 font-bold">{info.getValue()}</span>,
            size: 80,
        }),
        columnHelper.accessor('uom_name', {
            header: 'หน่วย',
            size: 60,
        }),
    ], []);

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบรับสินค้า (Create GRN)"
            titleIcon={<Package className="text-white" size={20} />}
            headerColor="bg-green-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedPOId}
                        className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        บันทึก
                    </button>
                </div>
            }
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 gap-4 overflow-auto">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                     <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                        ข้อมูลใบสั่งซื้อ
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                ใบสั่งซื้อ (Purchase Order)
                            </label>
                            <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={selectedPOId}
                                onChange={(e) => setSelectedPOId(e.target.value)}
                            >
                                <option value="">-- เลือกใบสั่งซื้อ --</option>
                                {poList.map(po => (
                                    <option key={po.po_id} value={po.po_id}>
                                        {po.po_no} - {po.vendor_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                วันที่รับของ
                            </label>
                            <input 
                                type="date"
                                className="w-full p-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                            />
                        </div>

                         <div>
                             {selectedPO && (
                                <div className="text-sm p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-full flex flex-col justify-center">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">คลังสินค้า:</span>
                                        <span className="font-semibold">{selectedPO.branch_name || 'Main Warehouse'}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-500">ผู้จำหน่าย:</span>
                                        <span className="font-semibold truncate w-24 text-right">{selectedPO.vendor_name}</span>
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                     <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        รายการรับเข้า
                    </h3>

                    {!selectedPOId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                             <AlertCircle size={48} className="mb-2 opacity-50" />
                            <p>กรุณาเลือก PO เพื่อแสดงรายการสินค้า</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                            <SmartTable
                                data={items}
                                columns={columns}
                                isLoading={false}
                                pagination={{
                                    pageIndex: 1,
                                    pageSize: Math.max(items.length, 10),
                                    totalCount: items.length,
                                    onPageChange: () => {},
                                    onPageSizeChange: () => {}
                                }}
                                className="h-full"
                            />
                        </div>
                    )}
                </div>
            </div>
        </WindowFormLayout>
    );
}
