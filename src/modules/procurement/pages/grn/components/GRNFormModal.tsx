import { useState, useMemo, useEffect, useRef } from 'react';
import { Save, Package, Plus, Trash2, Search, ChevronDown } from 'lucide-react';
import { WindowFormLayout, CustomDateInput } from '@ui';
import { POSearchModal } from './POSearchModal';
import { POAService } from '@/modules/procurement/services';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { LotSearchModal } from './LotSearchModal';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { GRNService } from '@/modules/procurement/services/grn.service';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import type { CurrencyMappedItem } from '@/modules/master-data/currency/types/currency-types';
import type { POListItem } from '@/modules/procurement/types';
import type { CreateGRNPayload, GRNLineItemInput } from '@/modules/procurement/types/grn-types';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialPOId?: number;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function GRNFormModal({ isOpen, onClose, onSuccess, initialPOId }: Props) {
    const { toast } = useToast();
    const prevIsOpenRef = useRef(false);
    
    // -- State --
    const [grnNo] = useState<string>('GRN2024-xxx');
    const [selectedPOId, setSelectedPOId] = useState<number | undefined>(undefined);
    const [selectedPO, setSelectedPO] = useState<POListItem | null>(null);
    const [items, setItems] = useState<GRNLineItemInput[]>([]);
    const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [remark, setRemark] = useState<string>('');
    const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
    const [receivedBy, setReceivedBy] = useState<number | undefined>(undefined);
    const [empDeptId, setEmpDeptId] = useState<string | undefined>(undefined);
    const [jobId, setJobId] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<string>('Draft');
    const [isMulticurrency, setIsMulticurrency] = useState(false);
    const [currencyId, setCurrencyId] = useState<string | undefined>(undefined);
    const [currencyCode, setCurrencyCode] = useState<string>('THB');
    const [targetCurrencyId, setTargetCurrencyId] = useState<string | undefined>(undefined);
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [rateDate, setRateDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    const [currencyOptions, setCurrencyOptions] = useState<CurrencyMappedItem[]>([]);
    const [isRateLoading, setIsRateLoading] = useState(false);
    const [isPOSearchOpen, setIsPOSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [currentLotLineIndex, setCurrentLotLineIndex] = useState<number | null>(null);
    const [uomOptions, setUomOptions] = useState<UnitListItem[]>([]);


    
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            // Reset form
            setSelectedPOId(initialPOId);
            setSelectedPO(null);
            setItems([]);
            setFormDate(new Date().toISOString().split('T')[0]);
            setRemark('');
            setWarehouseId(undefined);
            setReceivedBy(undefined);
            setEmpDeptId(undefined);
            setJobId(undefined);
            setStatus('Draft');
            setIsMulticurrency(false);

            // Load Currencies and Rate Types
            CurrencyService.getCurrencies().then(res => {
                console.log('💎 [GRN] Currencies Loaded:', res);
                setCurrencyOptions(res.items);
                // System Default to THB
                const thb = res.items.find(c => c.code === 'THB');
                if (thb) {
                    setCurrencyId(thb.id);
                    setCurrencyCode('THB');
                    setTargetCurrencyId(thb.id);
                }
            });

            // Load UOMs
            UnitService.getAll().then((res: PaginatedListResponse<UnitListItem>) => {
                setUomOptions(res.items);
            });
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialPOId]);

    // -- Handle PO Selection & Exchange Rate --
    useEffect(() => {
        if (selectedPOId) {
            // 🎯 Use POAService for better mapping (Remaining Qty & POA Number)
            POAService.getById(selectedPOId).then(po => {
                if (po) {
                    setSelectedPO(po);
                    
                    // Populate items from PO (Using Remaining Qty)
                    if (po.po_lines) {
                        const poItems: GRNLineItemInput[] = po.po_lines.map(line => ({
                            po_line_id: line.po_line_id,
                            item_id: line.item_id,
                            item_code: line.item_code || '',
                            item_name: line.item_name || '',
                            qty_ordered: line.qty || 0,
                            // 🎯 Priority: remaining_qty from POAService
                            qty_received: line.remaining_qty ?? ((line.qty || 0) - (line.qty_received || 0)),
                            accepted_qty: line.remaining_qty ?? ((line.qty || 0) - (line.qty_received || 0)),
                            rejected_qty: 0,
                            uom_id: line.uom_id ? String(line.uom_id) : undefined,
                            uom_name: line.uom_name || 'PCS',
                            unit_price: line.unit_price || 0,
                            line_total: (line.remaining_qty ?? 0) * (line.unit_price || 0),
                            qc_status: 'PASS',
                            lot_id: '',
                            lot_code: '',
                            remark: ''
                        }));
                        setItems(poItems);
                    }

                    // Populate Multicurrency from PO
                    const poCurrencyCode = po.quote_currency_code || po.currency_code || 'THB';
                    if (poCurrencyCode !== 'THB') {
                        setIsMulticurrency(true);
                        setCurrencyCode(poCurrencyCode);
                        setExchangeRate(po.exchange_rate || 1);
                        setRateDate(po.exchange_rate_date || new Date().toISOString().split('T')[0]);
                        
                        // 🎯 Smart Lookup: Match Currency ID from Master Data
                        const matchedCurr = currencyOptions.find(c => c.code === poCurrencyCode);
                        if (matchedCurr) setCurrencyId(matchedCurr.id);
                    } else {
                        setIsMulticurrency(false);
                        setCurrencyCode('THB');
                        setExchangeRate(1);
                        // Default back to THB ID
                        const thb = currencyOptions.find(c => c.code === 'THB');
                        if (thb) setCurrencyId(thb.id);
                    }
                }
            });
        } else {
            setSelectedPO(null);
            setItems([]);
        }
    }, [selectedPOId, currencyOptions]);

    // -- Lot Search Handlers --
    const handleOpenLotSearch = (index: number) => {
        setCurrentLotLineIndex(index);
        setIsLotSearchOpen(true);
    };

    const handleSelectLot = (lot: LotNo) => {
        if (currentLotLineIndex !== null) {
            setItems(prev => {
                const newItems = [...prev];
                newItems[currentLotLineIndex] = { 
                    ...newItems[currentLotLineIndex], 
                    lot_id: String(lot.id),
                    lot_code: lot.code
                };
                return newItems;
            });
        }
        setIsLotSearchOpen(false);
    };

    // Handle Exchange Rate Calculation from Master Data & API
    useEffect(() => {
        const fetchRate = async () => {
            if (!isMulticurrency || !currencyId || !targetCurrencyId || !rateDate) {
                console.log('💎 [GRN] fetchRate skipped:', { isMulticurrency, currencyId, targetCurrencyId, rateDate });
                return;
            }
            
            // 1. Immediate Calculation from Master Data
            const baseCurr = currencyOptions.find(c => String(c.id) === String(currencyId));
            const targetCurr = currencyOptions.find(c => String(c.id) === String(targetCurrencyId));

            if (baseCurr && targetCurr) {
                if (String(currencyId) === String(targetCurrencyId)) {
                    setExchangeRate(1);
                } else {
                    // Calculate Cross-Rate: Base_Rate / Target_Rate
                    const bRate = Number(baseCurr.exchange_rate) || 1;
                    const tRate = Number(targetCurr.exchange_rate) || 1;
                    const masterRate = bRate / tRate;
                    setExchangeRate(Number(masterRate.toFixed(6)));
                    console.log(`💎 [GRN] Calculated Master Rate: ${baseCurr.code}(${bRate}) / ${targetCurr.code}(${tRate}) = ${masterRate}`);
                }
            }

            // 2. Fetch specific date rate if backend supports it
            if (currencyCode !== 'THB' && targetCurrencyId) {
                setIsRateLoading(true);
                try {
                    const res = await CurrencyService.getLatestExchangeRate(currencyId, rateDate);
                    console.log('💎 [GRN] API Rate Response:', res);
                    if (res && res.rate && Number(res.rate) !== 0) { 
                        setExchangeRate(Number(res.rate));
                    }
                } catch (error) {
                    logger.error('[GRNFormModal] Failed to fetch exchange rate:', error);
                } finally {
                    setIsRateLoading(false);
                }
            }
        };

        fetchRate();
    }, [isMulticurrency, currencyId, targetCurrencyId, rateDate, currencyCode, currencyOptions]);

    // -- Handlers --
    const handleQuantityChange = (index: number, value: string | number) => {
        const numValue = value === '' ? 0 : Number(value);
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            item.qty_received = numValue;
            item.accepted_qty = numValue;
            item.rejected_qty = 0;
            if (item.unit_price) {
                item.line_total = numValue * item.unit_price;
            }
            newItems[index] = item;
            return newItems;
        });
    };

    const handleUomChange = (index: number, uomId: string) => {
        const selectedUom = uomOptions.find(u => String(u.uom_id || u.id) === uomId);
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { 
                ...newItems[index], 
                uom_id: uomId,
                uom_name: selectedUom?.uom_name || selectedUom?.unit_name || ''
            };
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
            po_line_id: Date.now(),
            item_id: undefined,
            item_code: '',
            item_name: '',
            qty_ordered: 0,
            qty_received: 0,
            accepted_qty: 0,
            rejected_qty: 0,
            uom_name: '',
            unit_price: 0,
            line_total: 0,
            qc_status: 'PASS',
            lot_id: '',
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
             warehouse_id: warehouseId || selectedPO?.ship_to_warehouse_id || 0,
             received_by: receivedBy || 0,
             status: status,
             emp_dept_id: empDeptId,
             job_id: jobId,
             remark: remark,
             // Financial/Tax
             curr_id: isMulticurrency ? currencyId : undefined,
             curr_type_id: isMulticurrency ? targetCurrencyId : undefined,
             curr_type_code: isMulticurrency ? currencyCode : 'THB',
             // Note: CreateGRNPayload doesn't have exchange_rate yet in schema, 
             // but we'll include it in case the backend supports it dynamically
             ...(isMulticurrency ? { exchange_rate: exchangeRate } : {}), 
             items: items.map(i => ({
                 po_line_id: Number(i.po_line_id) || 0,
                 item_id: Number(i.item_id) || 0,
                 qty_received: i.qty_received,
                 accepted_qty: i.accepted_qty,
                 rejected_qty: i.rejected_qty,
                 uom_id: i.uom_id || '',
                 lot_id: i.lot_id,
                 remark: i.remark
             }))
        };

        try {
            await GRNService.create(payload);
            onClose(); 
            toast('บันทึกใบรับสินค้าเรียบร้อยแล้ว', 'success');
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 100);
        } catch (error) {
            logger.error('[GRNFormModal] handleSubmit error:', error);
            toast('เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    };

    // -- Calculated Values --
    const totalItems = items.length;
    const totalReceived = useMemo(() => items.reduce((sum, item) => sum + (item.qty_received || 0), 0), [items]);
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.line_total || 0), 0), [items]);

    // -- Styles --
    const inputClass = 'w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none disabled:opacity-70';
    const selectClass = 'w-full h-8 pl-3 pr-8 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 appearance-none outline-none disabled:opacity-70 transition-all';
    const labelClass = 'block text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1';
    const sectionHeaderClass = 'text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2';

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบรับสินค้าใหม่ (Create GRN)"
            titleIcon={<div className="bg-violet-500 p-2 rounded-lg shadow"><Package className="text-white" size={20} /></div>}
            headerColor="border-violet-600 bg-violet-600 bg-gradient-to-r from-violet-700 to-violet-500 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
            footer={
                <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10">
                    <div className="text-xs text-red-500">* ฟิลด์ที่จำเป็นต้องกรอก</div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedPOId}
                            className="px-8 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Save size={18} />
                            บันทึก
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 gap-6 overflow-auto">
                
                {/* ========== GRN Header Section ========== */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                    <div className="border-l-4 border-violet-500 pl-3 mb-6">
                        <h3 className={sectionHeaderClass}>
                            ใบรับสินค้า (GRN Header)
                        </h3>
                    </div>
                    
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelClass}>
                                เลขที่ GRN <span className="text-gray-400 font-normal">(grn_no)</span> <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={grnNo} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-medium`} />
                        </div>
                        <div>
                            <label className={labelClass}>
                                วันที่รับ <span className="text-gray-400 font-normal">(grn_date)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="relative h-8">
                                <CustomDateInput 
                                    value={formDate} 
                                    onChange={(val) => setFormDate(val)} 
                                    className={inputClass} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                เลขที่ PO อ้างอิง <span className="text-gray-400 font-normal">(po_id FK)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={selectedPO?.po_no || 'PO2024-xxx'} 
                                    readOnly 
                                    className={`${inputClass} flex-1 bg-gray-50 dark:bg-gray-800/50 text-gray-500`}
                                    placeholder="PO2024-xxx"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setIsPOSearchOpen(true)}
                                    className="px-4 h-8 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 flex items-center justify-center"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div>
                            <label className={labelClass}>
                                รับเข้าคลัง <span className="text-gray-400 font-normal">(warehouse_id FK)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select value={warehouseId || ''} onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : undefined)} className={selectClass}>
                                    <option value="">-- เลือกคลังสินค้า --</option>
                                    <option value={1}>คลังสินค้าหลัก</option>
                                    <option value={2}>คลังสินค้าสาขา</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                ผู้รับสินค้า <span className="text-gray-400 font-normal">(received_by)</span> <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select value={receivedBy || ''} onChange={(e) => setReceivedBy(e.target.value ? Number(e.target.value) : undefined)} className={selectClass}>
                                    <option value="">-- เลือกผู้รับสินค้า --</option>
                                    <option value={1}>สมชาย ใจดี</option>
                                    <option value={2}>สมหญิง รักดี</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                แผนก <span className="text-gray-400 font-normal">(department_code)</span>
                            </label>
                            <div className="relative">
                                <select value={empDeptId || ''} onChange={(e) => setEmpDeptId(e.target.value)} className={selectClass}>
                                    <option value="">-- เลือกแผนก --</option>
                                    <option value="DEPT01">ฝ่ายผลิต</option>
                                    <option value="DEPT02">ฝ่ายขาย</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div>
                            <label className={labelClass}>
                                งาน <span className="text-gray-400 font-normal">(job_code)</span>
                            </label>
                            <div className="relative">
                                <select value={jobId || ''} onChange={(e) => setJobId(e.target.value)} className={selectClass}>
                                    <option value="">-- เลือกงาน --</option>
                                    <option value="JOB01">งานติดตั้งเครื่องจักร</option>
                                    <option value="JOB02">งานซ่อมบำรุงประจำปี</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                สถานะ <span className="text-gray-400 font-normal">(status)</span>
                            </label>
                            <div className="relative">
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${selectClass} font-medium text-violet-600`}>
                                    <option value="Draft">Draft</option>
                                    <option value="Posted">Posted</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="mt-6">
                        <label className={labelClass}>
                            หมายเหตุ <span className="text-gray-400 font-normal">(remarks - optional)</span>
                        </label>
                        <textarea 
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                            rows={2}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 resize-none shadow-sm transition-all"
                        />
                    </div>

                    {/* Multicurrency Section */}
                    <div className="mt-4">
                        <MulticurrencyWrapper
                            name="isMulticurrency"
                            checked={isMulticurrency}
                            onCheckedChange={(checked) => setIsMulticurrency(checked)}
                            label="Multicurrency (เปิดใช้งานหลายสกุลเงิน)"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                                    <CustomDateInput 
                                        value={rateDate}
                                        onChange={(val) => setRateDate(val)}
                                        className={inputClass}
                                        disabled={!isMulticurrency}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={currencyId || ''} 
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setCurrencyId(id);
                                                const code = currencyOptions.find(c => c.id === id)?.code || 'THB';
                                                setCurrencyCode(code);
                                            }} 
                                            className={selectClass}
                                            disabled={!isMulticurrency}
                                        >
                                            <option value="">-- เลือกสกุลเงิน --</option>
                                            {currencyOptions.map(c => (
                                                <option key={c.id} value={c.id}>{c.code} - {c.name_th}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                                    <div className="relative">
                                        <select 
                                            value={targetCurrencyId || ''} 
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setTargetCurrencyId(id);
                                            }} 
                                            className={selectClass}
                                            disabled={!isMulticurrency}
                                        >
                                            <option value="">-- เลือกสกุลเงิน --</option>
                                            {currencyOptions.map(c => (
                                                <option key={c.id} value={c.id}>{c.code} - {c.name_th}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        อัตราแลกเปลี่ยน {isRateLoading && <span className="text-violet-500 text-[10px] animate-pulse">(Updating...)</span>}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={exchangeRate} 
                                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                                            readOnly={currencyCode === 'THB'}
                                            disabled={!isMulticurrency}
                                            className={`${inputClass} text-right font-medium ${currencyCode === 'THB' ? 'bg-gray-100 dark:bg-gray-800/50 italic' : ''}`}
                                            step="0.0001"
                                        />
                                        {currencyCode && currencyCode !== 'THB' && (
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                                                1 {currencyCode} =
                                            </div>
                                        )}
                                    </div>
                                    {currencyCode && currencyCode !== 'THB' && (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                                            1 {currencyCode} ≈ {Number(exchangeRate || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                                        </div>
                                    )}
                                </div>
                            </div>
                        </MulticurrencyWrapper>
                    </div>
                </div>

                {/* ========== Line Items Section ========== */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="border-l-4 border-violet-500 pl-3">
                            <h3 className={sectionHeaderClass}>
                                รายการสินค้าที่รับ (GRN Line Items)
                            </h3>
                        </div>
                        <button 
                            type="button"
                            onClick={handleAddLine}
                            className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            เพิ่มรายการ
                        </button>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden scrollbar-hide">
                        <table className="w-full min-w-[1000px] text-sm table-fixed border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400">
                                    <th className="px-6 py-4 text-center w-[60px] font-bold border-b border-gray-100 dark:border-gray-800">ลำดับ</th>
                                    <th className="px-6 py-4 text-left w-[180px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        รหัสสินค้า<br/><span className="text-[10px] font-normal text-gray-400">(item_id FK)</span>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold border-b border-gray-100 dark:border-gray-800">ชื่อสินค้า</th>
                                    <th className="px-6 py-4 text-center w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        จำนวนสั่ง<br/><span className="text-[10px] font-normal text-gray-400">(PO Qty)</span>
                                    </th>
                                    <th className="px-6 py-4 text-center w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        จำนวนรับ<br/><span className="text-[10px] font-normal text-red-500">(qty_received)*</span>
                                    </th>
                                    <th className="px-6 py-4 text-left w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        หน่วย<br/><span className="text-[10px] font-normal text-gray-400">(uom_id FK)</span>
                                    </th>
                                    <th className="px-6 py-4 text-left w-[150px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        Lot No<br/><span className="text-[10px] font-normal text-gray-400">(lot_no)</span>
                                    </th>
                                    <th className="px-6 py-4 text-left w-[200px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">
                                        หมายเหตุ<br/><span className="text-[10px] font-normal text-gray-400">(remarks)</span>
                                    </th>
                                    <th className="px-4 py-4 text-center w-[60px] font-bold border-b border-gray-100 dark:border-gray-800">ลบ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {items.map((item, index) => (
                                    <tr key={item.po_line_id} className="group hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-medium">{index + 1}</td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="text" 
                                                value={item.item_code} 
                                                readOnly 
                                                className="w-full h-9 px-2 text-sm font-bold text-gray-700 dark:text-gray-100 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all outline-none border-b border-gray-50 dark:border-transparent" 
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="text" 
                                                value={item.item_name} 
                                                readOnly 
                                                className="w-full h-9 px-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all outline-none" 
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="number" 
                                                value={item.qty_ordered} 
                                                readOnly 
                                                className="w-full h-9 px-2 text-sm text-center border border-gray-100 dark:border-gray-800 rounded bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium"                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="number" 
                                                min={0}
                                                value={item.qty_received === 0 ? '' : item.qty_received} 
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                className="w-full h-9 px-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 font-bold focus:ring-2 focus:ring-violet-500 shadow-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="relative">
                                                <select 
                                                    value={item.uom_id || ''} 
                                                    onChange={(e) => handleUomChange(index, e.target.value)}
                                                    className="w-full h-9 pl-2 pr-7 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 appearance-none outline-none focus:border-violet-500"
                                                >
                                                    <option value="" disabled>หน่วย</option>
                                                    {uomOptions.map(uom => (
                                                        <option key={uom.uom_id || uom.id} value={String(uom.uom_id || uom.id)}>
                                                            {uom.uom_name || uom.unit_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="relative group/lot w-full min-w-[120px]">
                                                <input 
                                                    type="text" 
                                                    value={item.lot_code || ''} 
                                                    onClick={() => handleOpenLotSearch(index)}
                                                    readOnly
                                                    placeholder="คลิกเลือก Lot..."
                                                    className="w-full h-9 px-2 pr-8 text-[11px] border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-[#1a1c23] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-sm outline-none"
                                                />
                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover/lot:text-violet-500 transition-colors pointer-events-none">
                                                    <Search size={14} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <input 
                                                type="text" 
                                                value={item.remark || ''} 
                                                onChange={(e) => handleRemarkChange(index, e.target.value)}
                                                placeholder="หมายเหตุ"
                                                className="w-full h-9 px-2 text-sm text-gray-700 dark:text-gray-300 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveLine(index)}
                                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
                                                <Package size={48} strokeWidth={1} />
                                                <p className="text-sm">กรุณาเลือก PO เพื่อดึงรายการสินค้า หรือกดปุ่ม "เพิ่มรายการ"</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-8 flex justify-end">
                        <div className="bg-violet-50/50 dark:bg-violet-900/10 border-2 border-violet-100 dark:border-violet-900/30 rounded-2xl p-6 min-w-[350px] shadow-sm">
                            <div className="space-y-4">
                                {/* Total Items Count */}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">จำนวนรายการทั้งหมด:</span>
                                    <span className="font-bold text-gray-900 dark:text-white px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-violet-100 dark:border-violet-900/30">
                                        {totalItems} <span className="text-[10px] font-normal text-gray-400 uppercase ml-1">Items</span>
                                    </span>
                                </div>

                                {/* Total Quantity Received */}
                                <div className="flex justify-between items-center text-sm border-b border-violet-100/50 dark:border-violet-900/20 pb-4">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">จำนวนที่รับรวม:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {totalReceived.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        <span className="text-[10px] font-normal text-gray-400 uppercase ml-1">Units</span>
                                    </span>
                                </div>

                                {/* Grand Total Amount */}
                                <div className="flex justify-between items-end pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-violet-700 dark:text-violet-300 font-bold text-sm">ยอดรวมเงินสุทธิ</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-medium">Grand Total Amount</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-violet-600 dark:text-violet-400 text-3xl leading-none">
                                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="ml-2 text-sm font-bold text-gray-500 uppercase">{isMulticurrency ? currencyCode : 'THB'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* PO Search Modal (Extracted Component) */}
            <POSearchModal 
                isOpen={isPOSearchOpen}
                onClose={() => setIsPOSearchOpen(false)}
                onSelect={(po: POListItem) => {
                    setSelectedPOId(po.po_id);
                    setIsPOSearchOpen(false);
                }}
            />
            {/* Lot Search Modal */}
            <LotSearchModal 
                isOpen={isLotSearchOpen}
                onClose={() => setIsLotSearchOpen(false)}
                onSelect={handleSelectLot}
                itemId={currentLotLineIndex !== null ? items[currentLotLineIndex]?.item_id : undefined}
                vendorId={selectedPO?.vendor_id}
            />
        </WindowFormLayout>
    );
}

