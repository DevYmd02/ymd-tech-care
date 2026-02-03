import { useState, useMemo, useEffect, useRef } from 'react';
import { Save, FileText, Plus, Trash2 } from 'lucide-react';
import { WindowFormLayout } from '@layout/WindowFormLayout';
import { POService } from '@/services/procurement/po.service';
import { VendorService } from '@/services/procurement/vendor.service';
import type { POLineItemInput, CreatePOPayload, POFormData } from '@/types/po-types';
import type { VendorDropdownItem } from '@/types/vendor-types';
import { SmartTable } from '@ui/SmartTable';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

// ====================================================================================
// INTERNAL HELPERS
// ====================================================================================

const columnHelper = createColumnHelper<POLineItemInput>();

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialValues?: Partial<POFormData>; // For starting from QC or other sources
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function POFormModal({ isOpen, onClose, onSuccess, initialValues }: Props) {
    const prevIsOpenRef = useRef(false);
    
    // -- State --
    // Initialize directly from props to avoid flicker
    const [vendorOptions, setVendorOptions] = useState<VendorDropdownItem[]>([]);
    
    const [vendorId, setVendorId] = useState<string>(initialValues?.vendor_id || '');
    const [poDate, setPoDate] = useState<string>(initialValues?.po_date || new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(initialValues?.delivery_date || '');
    const [paymentTerm, setPaymentTerm] = useState<number>(initialValues?.payment_term_days || 30);
    const [remarks, setRemarks] = useState<string>(initialValues?.remarks || '');
    
    // Items
    const [items, setItems] = useState<POLineItemInput[]>(initialValues?.items || []);
    
    // Summary
    const [isVatIncluded, setIsVatIncluded] = useState<boolean>(initialValues?.tax_rate === 7 || initialValues?.tax_rate === undefined ? true : false);

    // Fetch Vendors on mount
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const data = await VendorService.getDropdown();
                setVendorOptions(data);
            } catch (error) {
                console.error('Failed to fetch vendor dropdown:', error);
            }
        };
        fetchVendors();
    }, []);

    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            // Reset form or use initialValues
            if (initialValues) {
                setVendorId(initialValues.vendor_id || '');
                setPoDate(initialValues.po_date || new Date().toISOString().split('T')[0]);
                setDeliveryDate(initialValues.delivery_date || '');
                setPaymentTerm(initialValues.payment_term_days || 30);
                setRemarks(initialValues.remarks || '');
                setItems(initialValues.items || []);
                setIsVatIncluded(initialValues.tax_rate === 7); // Rough check
            } else {
                setVendorId('');
                setPoDate(new Date().toISOString().split('T')[0]);
                setDeliveryDate('');
                setPaymentTerm(30);
                setRemarks('');
                setItems([]);
                setIsVatIncluded(true);
            }
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialValues]);

    // -- Handlers --
    const handleAddItem = () => {
        const newItem: POLineItemInput = {
            item_id: `new-${Date.now()}`,
            item_code: 'NEW-ITEM',
            item_name: 'New Product Item',
            qty: 1,
            unit_price: 0,
            line_total: 0
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof POLineItemInput, value: number | string) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            
            // @ts-expect-error - dynamic key assignment safe here due to strict types above
            item[field] = value;

            // Recalc
            if (field === 'qty' || field === 'unit_price' || field === 'discount') {
                const qty = Number(item.qty) || 0;
                const price = Number(item.unit_price) || 0;
                const discount = Number(item.discount) || 0;
                item.line_total = (qty * price) - discount;
            }

            newItems[index] = item;
            return newItems;
        });
    };

    // Calculate Summary
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const taxAmount = isVatIncluded ? subtotal * 0.07 : 0;
    const totalAmount = subtotal + taxAmount;

    const handleSubmit = async () => {
        if (!vendorId) {
            window.alert('กรุณาเลือกผู้ขาย');
            return;
        }
        if (items.length === 0) {
            window.alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
            return;
        }
        
        const payload: CreatePOPayload = {
            vendor_id: vendorId,
            order_date: poDate, // Map po_date -> order_date
            delivery_date: deliveryDate,
            payment_term: String(paymentTerm), // Map number -> string if needed or update type
            items: items.map(item => ({
                item_id: item.item_id,
                qty: item.qty,
                unit_price: item.unit_price,
                discount: item.discount
            })),
            remarks: remarks,
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount
        };

        try {
            await POService.create(payload);
            window.alert('บันทึกใบสั่งซื้อเรียบร้อยแล้ว');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            window.alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // -- Columns --
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = useMemo<ColumnDef<POLineItemInput, any>[]>(() => [
        columnHelper.accessor('item_code', {
            header: 'รหัสสินค้า',
            cell: info => <input 
                className="w-full bg-transparent outline-none" 
                value={info.getValue()} 
                onChange={e => handleItemChange(info.row.index, 'item_code', e.target.value)} 
            />,
            size: 100,
        }),
        columnHelper.accessor('item_name', {
            header: 'รายละเอียด',
            cell: info => <input 
                className="w-full bg-transparent outline-none" 
                value={info.getValue()} 
                onChange={e => handleItemChange(info.row.index, 'item_name', e.target.value)} 
            />,
            size: 200,
        }),
        columnHelper.accessor('qty', {
            header: 'จำนวน',
            cell: ({ row, getValue }) => (
                <input 
                    type="number" 
                    min={0}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white dark:bg-gray-800 dark:border-gray-700"
                    value={getValue()}
                    onChange={e => handleItemChange(row.index, 'qty', Number(e.target.value))}
                />
            ),
            size: 80,
        }),
        columnHelper.accessor('unit_price', {
            header: 'ราคา/หน่วย',
            cell: ({ row, getValue }) => (
                <input 
                    type="number" 
                    min={0}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white dark:bg-gray-800 dark:border-gray-700"
                    value={getValue()}
                    onChange={e => handleItemChange(row.index, 'unit_price', Number(e.target.value))}
                />
            ),
            size: 100,
        }),
        columnHelper.accessor('line_total', {
            header: 'รวมเงิน',
            cell: info => <div className="text-right font-medium">{info.getValue()?.toLocaleString()}</div>,
            size: 100,
        }),
        columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <button 
                    onClick={() => handleRemoveItem(row.index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                >
                    <Trash2 size={16} />
                </button>
            ),
            size: 40
        })
    ], []); // Dependencies for calculation if needed, though handleItemChange updates state

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบสั่งซื้อ (Create Purchase Order)"
            titleIcon={<FileText className="text-white" size={20} />}
            headerColor="bg-emerald-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10">
                     <div className="text-sm text-gray-500">
                        {items.length} รายการ
                    </div>
                    <div className="flex gap-x-2">
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
                            className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            บันทึก
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 gap-4 overflow-auto">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                     <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                        ข้อมูลทั่วไป
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                ผู้ขาย (Vendor)
                            </label>
                            <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                            >
                                <option value="">-- เลือกผู้ขาย --</option>
                                {vendorOptions.map(v => (
                                    <option key={v.vendor_code} value={v.vendor_code} title={v.vendor_name}>
                                        {/* Use vendor_code as ID for now because getDropdown returns that, though payload expects ID. 
                                            Ideally getDropdown returns {id, name}. 
                                            Let's check VendorDropdownItem type.
                                        */}
                                        {v.vendor_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                วันที่สั่งซื้อ
                            </label>
                            <input 
                                type="date"
                                className="w-full p-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={poDate}
                                onChange={(e) => setPoDate(e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                เครดิต (วัน)
                            </label>
                            <input 
                                type="number"
                                className="w-full p-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={paymentTerm}
                                onChange={(e) => setPaymentTerm(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            รายการสินค้า
                        </h3>
                        <button
                            onClick={handleAddItem}
                            className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1"
                        >
                            <Plus size={16} />
                            เพิ่มรายการ
                        </button>
                     </div>

                    <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                        <SmartTable
                            data={items}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            columns={columns as any}
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
                    
                    {/* Summary Footer In-Body */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">รวมเป็นเงิน</span>
                                <span className="font-medium">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={isVatIncluded} 
                                        onChange={e => setIsVatIncluded(e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    VAT 7%
                                </span>
                                <span className="font-medium">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-base font-bold text-emerald-700 dark:text-emerald-400">
                                <span>ยอดรวมสุทธิ</span>
                                <span>{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WindowFormLayout>
    );
}
