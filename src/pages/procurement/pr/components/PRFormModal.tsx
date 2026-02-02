/**
 * @file PRFormModal.tsx
 * @description Modal สำหรับสร้างใบขอซื้อ - Full Migration PRFormData + Summary + Tabs + Product Search
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { PRFormData, PRLineFormData } from '@/types/pr-types';
import { FileText, Plus, Trash2, Search, Eraser, FileBox, MoreHorizontal, Flame, FileBarChart, History as HistoryIcon, Printer, Copy, CheckCircle } from 'lucide-react';

import { PRHeader } from './PRHeader';

import { WindowFormLayout } from '@layout/WindowFormLayout';
import { masterDataService } from '@/services/MasterDataService';
import { prService } from '@/services/PRService';
import type { ItemMaster, CostCenter, Project } from '@/types/master-data-types';
import type { VendorMaster } from '@/types/vendor-types';
import { SystemAlert } from '@ui/SystemAlert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  onSuccess?: () => void;
}

// ====================================================================================
// CONFIGURATION CONSTANTS
// ====================================================================================

/** ค่า Config สำหรับใบขอซื้อ */
const PR_CONFIG = {
  /** จำนวนแถวขั้นต่ำที่ต้องมี */
  MIN_LINES: 5,
  /** จำนวนแถวเริ่มต้นเมื่อเปิดฟอร์ม */
  INITIAL_LINES: 5,
} as const;

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

// Extended line with warehouse, location, discount for UI display
interface ExtendedLine extends PRLineFormData {
  warehouse?: string;
  location?: string;
  discount?: number;
}

const createEmptyLine = (): ExtendedLine => ({
  item_id: '', item_code: '', item_name: '', item_description: '', quantity: 0, uom: '',
  est_unit_price: 0, est_amount: 0, needed_date: getTodayDate(), preferred_vendor_id: undefined, remark: '',
  warehouse: '', location: '', discount: 0,
});

const getInitialLines = () => Array(PR_CONFIG.INITIAL_LINES).fill(null).map(() => createEmptyLine());

const getDefaultFormValues = (): PRFormData => ({
  pr_no: '', request_date: getTodayDate(), required_date: '', requester_name: 'นางสาว กรรลิกา สารมาท',
  cost_center_id: '', project_id: undefined, purpose: '', currency_code: 'THB', lines: [], total_amount: 0,
  delivery_date: '', credit_days: 30, vendor_quote_no: '', shipping_method: 'รถยนต์', remarks: '',
});

export const PRFormModal: React.FC<Props> = ({ isOpen, onClose, id, onSuccess }) => {
  const isEditMode = !!id;
  const prevIsOpenRef = useRef(false);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [lines, setLines] = useState<ExtendedLine[]>(getInitialLines);
  const [activeTab, setActiveTab] = useState('detail');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatRate, setVatRate] = useState(7);
  const [remarks, setRemarks] = useState('');
  
  // Info Bar state
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [creditDays, setCreditDays] = useState(30);
  const [vendorQuoteNo, setVendorQuoteNo] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [requesterName] = useState('นางสาว กรรลิกา สารมาท');
  
  // Product Search Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, setValue, reset, watch, formState: { isSubmitting } } = useForm<PRFormData>({
    defaultValues: getDefaultFormValues()
  });

  // Master Data State
  const [products, setProducts] = useState<ItemMaster[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // Fetch Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [items, cc, prj] = await Promise.all([
          masterDataService.getItems(),
          masterDataService.getCostCenters(),
          masterDataService.getProjects()
        ]);
        setProducts(items);
        setCostCenters(cc);
        setProjects(prj);
      } catch (error) {
        console.error('Failed to fetch master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  // Reset form when modal opens (only when transitioning from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Using setTimeout to avoid calling setState synchronously in effect
      const timer = setTimeout(async () => {
        // Reset ALL local states in Create Mode (!id)
        if (!id) {
          setLines(getInitialLines());
          setDiscountPercent(0);
          setVatRate(7);
          setRemarks('');
          
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          setDeliveryDate(nextWeek.toISOString().split('T')[0]);
          setCreditDays(30);
          setVendorQuoteNo('');
          setShippingMethod('');
          
          setActiveTab('detail');

          // Generate Next PR Number
          const nextPRNo = await prService.generateNextDocumentNo();
          
          reset({
            ...getDefaultFormValues(),
            pr_no: nextPRNo
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, reset, id]);


  const showAlert = (message: string) => {
    setAlertState({ show: true, message });
  };

  // Line handlers
  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);
  
  const removeLine = (index: number) => {
    if (lines.length <= PR_CONFIG.MIN_LINES) {
      showAlert(`ต้องมีอย่างน้อย ${PR_CONFIG.MIN_LINES} แถว`);
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearLine = (index: number) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = createEmptyLine();
      return newLines;
    });
  };
  
  const updateLine = (index: number, field: keyof ExtendedLine, value: string | number) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = { ...newLines[index] };
      
      // Type-safe field update for ExtendedLine
      if (field === 'quantity' || field === 'est_unit_price' || field === 'est_amount' || field === 'discount') {
        (line as Record<string, unknown>)[field] = value as number;
      } else {
        (line as Record<string, unknown>)[field] = value as string;
      }
      
      // Auto-calculate amount (quantity * price - discount)
      if (field === 'quantity' || field === 'est_unit_price' || field === 'discount') {
        const discount = line.discount || 0;
        line.est_amount = (line.quantity * line.est_unit_price) - discount;
      }
      
      newLines[index] = line;
      return newLines;
    });
  };

  // Product Search


  const handleClearLines = () => {
    if (window.confirm("คุณต้องการล้างรายการสินค้าทั้งหมดใช่หรือไม่?")) {
        setLines(getInitialLines());
    }
  };

  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setSearchTerm('');
    setIsProductModalOpen(true);
  };
  
  const selectProduct = (product: ItemMaster) => {
    if (activeRowIndex !== null) {
      setLines(prev => {
        // Find the first empty row to fill gaps
        const firstEmptyIndex = prev.findIndex(l => !l.item_id);
        const targetIndex = (firstEmptyIndex !== -1 && firstEmptyIndex < activeRowIndex) 
          ? firstEmptyIndex 
          : activeRowIndex;

        const newLines = [...prev];
        newLines[targetIndex] = {
          ...newLines[targetIndex],
          item_id: product.item_id,
          item_code: product.item_code,
          item_name: product.item_name,
          warehouse: product.warehouse || '', 
          location: product.location || '', 
          uom: product.unit_name || '',
          est_unit_price: product.standard_cost || 0,
          quantity: 1,
          est_amount: (product.standard_cost || 0) * 1,
        };
        return newLines;
      });
    } else {
      // Append Mode
      setLines(prev => {
        const newLine = createEmptyLine();
        newLine.item_id = product.item_id;
        newLine.item_code = product.item_code;
        newLine.item_name = product.item_name;
        newLine.warehouse = product.warehouse || '';
        newLine.location = product.location || '';
        newLine.uom = product.unit_name || '';
        newLine.est_unit_price = product.standard_cost || 0;
        newLine.est_amount = (product.standard_cost || 0) * 1;
        newLine.quantity = 1;
        return [...prev, newLine];
      });
    }
    setIsProductModalOpen(false);
  };

  // Calculations
  const subtotal = lines.reduce((sum, line) => sum + (line.est_amount || 0), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = afterDiscount * (vatRate / 100);
  const grandTotal = afterDiscount + vatAmount;

  const handleVendorSelect = (vendor: VendorMaster | null) => {
    if (vendor) {
      setValue("preferred_vendor_id", vendor.vendor_id);
      setValue("vendor_name", vendor.vendor_name);
      
      // Update Credit Days from Vendor Master
      const terms = vendor.payment_term_days;
      setCreditDays(terms !== undefined ? terms : 30);
    } else {
      setValue("preferred_vendor_id", undefined);
      setValue("vendor_name", '');
      
      // Reset Credit Days to default
      setCreditDays(30);
    }
  };

  const onSubmit: SubmitHandler<PRFormData> = async (data) => {
    // 1. Validation Logic
    if (!data.required_date) { showAlert('กรุณาระบุวันที่ต้องการใช้'); return; }
    if (!data.requester_name) { showAlert('กรุณาระบุชื่อผู้ขอซื้อ'); return; }
    if (!data.cost_center_id) { showAlert('กรุณาเลือกศูนย์ต้นทุน'); return; }
    if (!data.purpose) { showAlert('กรุณาระบุวัตถุประสงค์'); return; }
    if (!shippingMethod) { showAlert('กรุณาเลือกประเภทการขนส่ง'); return; }

    // Check for incomplete lines (has data but no item_code)
    const incompleteLines = lines.filter(l => !l.item_code && (l.quantity > 0 || l.remark));
    if (incompleteLines.length > 0) {
      showAlert('กรุณาเลือกรายการสินค้าให้ครบทุกแถวที่มีข้อมูล');
      return;
    }

    const activeLines = lines.filter(l => l.item_code);
    if (activeLines.length === 0) {
      showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    // 2. Confirmation Logic (After Validation)
    if (!window.confirm(isEditMode ? "คุณต้องการบันทึกการแก้ไขเอกสารนี้ใช่หรือไม่?" : "คุณต้องการบันทึกสร้างเอกสารใหม่ใช่หรือไม่?")) return;
    
    // 3. Prepare Payload
    const payload: PRFormData = { 
      ...data, 
      lines: activeLines, 
      total_amount: grandTotal,
      // Merge Info Bar & Remarks local states
      delivery_date: deliveryDate,
      credit_days: creditDays,
      vendor_quote_no: vendorQuoteNo,
      shipping_method: shippingMethod,
      remarks: remarks,
      requester_name: requesterName // Sync with hardcoded mock name
    };

    try {
        // 2. Create PR
        const newPR = await prService.create(payload);
        if (newPR?.pr_id) {
            // 3. Auto Submit for Testing
            const submitResult = await prService.submit(newPR.pr_id);
            if (submitResult.success) {
                window.alert(`บันทึกและส่งอนุมัติสำเร็จ!\nเลขที่: ${newPR.pr_no}\nสถานะ: รออนุมัติ (In Approval)`);
                onSuccess?.();
                onClose();
            } else {
                window.alert(`บันทึกสำเร็จแต่ส่งอนุมัติไม่ผ่าน: ${submitResult.message}`);
                onSuccess?.();
                onClose();
            }
        } else {
            showAlert('เกิดข้อผิดพลาดในการสร้างเอกสาร');
        }
    } catch (error) {
        console.error('Create PR failed', error);
        showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("คุณต้องการลบเอกสารนี้ใช่หรือไม่? (Are you sure you want to delete this PR?)")) return;

    setIsActionLoading(true);
    try {
      const success = await prService.delete(id);
      if (success) {
        onSuccess?.();
        onClose();
      } else {
        showAlert("ลบเอกสารไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      showAlert("เกิดข้อผิดพลาดในการลบเอกสาร");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePrint = () => {
    // window.open(`/procurement/pr/print/${id}`, '_blank');
    window.alert(`Coming Soon: Print PR ${id}`);
  };

  const handleCopy = () => {
    window.alert(`Coming Soon: Copy PR ${id}`);
  };

  const handleApprove = async () => {
    if (!id) return;
    
    if (!window.confirm("คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?")) return;
    
    setIsActionLoading(true);
    try {
      const success = await prService.approve(id);
      if (success) {
        window.alert("อนุมัติเอกสารเรียบร้อยแล้ว");
        onSuccess?.(); // Trigger refresh in parent
        onClose();     // Close modal
      } else {
        showAlert("ไม่อนุมัติเอกสารไม่สำเร็จ");
      }
    } catch (error) {
      console.error('Approve PR failed', error);
      showAlert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
    } finally {
      setIsActionLoading(false);
    }
  };

  // if (!isOpen && !isClosing) return null; // Handled by WindowFormLayout

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
  const tableInputClass = 'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 dark:text-white shadow-sm transition-all';
  const tdBaseClass = 'p-1 border-r border-gray-200 dark:border-gray-700';
  const tabClass = (tab: string) => `px-6 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`;

  const filteredProducts = products.filter(p => 
    p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "แก้ไขใบขอซื้อ (Edit Purchase Requisition)" : "สร้างใบขอซื้อ (Create Purchase Requisition)"}
      titleIcon={<div className="bg-red-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
      headerColor="bg-blue-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
      footer={
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
            {/* Left Side: Document Actions */}
            <div className="flex items-center gap-2">
                 {isEditMode && (
                    <>
                        <button 
                            type="button" 
                            onClick={handleDelete}
                            disabled={isSubmitting || isActionLoading}
                            className="flex items-center justify-center px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={16} className="mr-2" /> ลบเอกสาร
                        </button>
                        <button 
                            type="button" 
                            onClick={handlePrint}
                            disabled={isSubmitting || isActionLoading}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Printer size={16} className="mr-2" /> พิมพ์
                        </button>
                        <button 
                            type="button" 
                            onClick={handleCopy}
                            disabled={isSubmitting || isActionLoading}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Copy size={16} className="mr-2" /> คัดลอก
                        </button>
                    </>
                 )}
            </div>

            {/* Right Side: Form Controls */}
            <div className="flex items-center gap-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={isSubmitting || isActionLoading}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                {isEditMode && (
                    <button 
                        type="button" 
                        onClick={handleApprove}
                        disabled={isSubmitting || isActionLoading}
                        className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <CheckCircle size={16} />
                        อนุมัติ
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || isActionLoading}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                    บันทึก
                </button>
            </div>
        </div>
      }
    >
      {alertState.show && (
        <SystemAlert 
            message={alertState.message} 
            onClose={() => setAlertState({ ...alertState, show: false })} 
        />
      )}
      
      {/* Product Search Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setIsProductModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ค้นหาสินค้า</h2>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ</p>
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">×</button>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสสินค้าหรือชื่อสินค้า</label>
                <input 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="รหัสสินค้าหรือชื่อสินค้า" 
                  className="w-full h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800" 
                  autoFocus 
                />
              </div>
            </div>
            <div className="max-h-[450px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-gray-600 dark:text-gray-300">
                    <th className="px-3 py-3 text-center font-medium w-20">เลือก</th>
                    <th className="px-3 py-3 text-left font-medium">รหัสสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">ชื่อสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">รายละเอียด</th>
                    <th className="px-3 py-3 text-center font-medium">คลัง</th>
                    <th className="px-3 py-3 text-center font-medium">ที่เก็บ</th>
                    <th className="px-3 py-3 text-center font-medium">หน่วยนับ</th>
                    <th className="px-3 py-3 text-right font-medium">ราคา/หน่วย</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {filteredProducts.map((p) => (
                    <tr key={p.item_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => selectProduct(p)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors shadow-sm">เลือก</button>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{p.item_code}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.item_name}</td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 text-xs">{p.description}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.warehouse}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.location}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.unit_name}</td>
                      <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{p.standard_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-1.5 space-y-1">
        <div className={cardClass}>
          <PRHeader 
            register={register} 
            setValue={setValue} 
            watch={watch}
            costCenters={costCenters} 
            projects={projects} 
            onVendorSelect={handleVendorSelect}
          />
        </div>

        {/* Info Bar */}
        <div className={cardClass}>
            <div className="w-full overflow-x-auto border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
            <table className="w-full min-w-[800px] text-xs border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-blue-500 whitespace-nowrap w-48">วันที่กำหนดส่ง</th>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-blue-500 whitespace-nowrap w-24">เครดิต (วัน)</th>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-blue-500 whitespace-nowrap">Vendor Quote No.</th>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-blue-500 whitespace-nowrap">ขนส่งโดย <span className="text-red-300">*</span></th>
                  <th className="px-2 py-1.5 text-left font-normal whitespace-nowrap">ผู้ขอซื้อ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700">
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-sm w-full h-6 text-xs focus:outline-none focus:border-blue-500" />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700 text-center">
                    <input 
                      type="number" 
                      value={creditDays} 
                      readOnly
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm w-full h-6 text-xs text-center focus:outline-none cursor-not-allowed" 
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700 font-bold">
                    <input 
                      value={vendorQuoteNo} 
                      onChange={(e) => setVendorQuoteNo(e.target.value)} 
                      placeholder="ระบุเลขที่ใบเสนอราคา"
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-sm w-full h-6 text-xs focus:outline-none focus:border-blue-500" 
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700 font-bold">
                    <select 
                      value={shippingMethod} 
                      onChange={(e) => setShippingMethod(e.target.value)} 
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-sm w-full h-6 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- เลือก --</option>
                      <option value="รถยนต์">รถยนต์</option>
                      <option value="รถบรรทุก">รถบรรทุก</option>
                      <option value="ไปรษณีย์">ไปรษณีย์</option>
                      <option value="ขนส่งเอกชน">ขนส่งเอกชน</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 font-bold">
                    <input 
                      value={requesterName} 
                      readOnly
                      title="ชื่อผู้ขอซื้อ (ดึงจากระบบอัตโนมัติ)"
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm w-full h-6 text-xs focus:outline-none cursor-not-allowed" 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
        </div>

        {/* Item Table */}
        {/* Item Table */}
        {/* Unified Card Section (Product Items) */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          
          {/* 1. Top Section: Toolbar (Header) */}
          <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
             <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
               <FileBox className="text-blue-600 mr-2" size={20} />
               รายการสินค้า (Products)
             </div>
             <div className="flex items-center gap-2">
             </div>
          </div>

          {/* 2. Bottom Section: Table (Body) */}
          <div className="p-0 overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse bg-white dark:bg-gray-900 text-sm">
              <thead className="bg-blue-600 text-white text-xs">
                <tr>
                  <th className="p-2 w-12 text-center border-r border-blue-500 sticky left-0 z-10 bg-blue-600">No.</th>
                  <th className="p-2 w-24 text-center border-r border-blue-500">รหัสสินค้า</th>
                  <th className="p-2 min-w-[180px] text-center border-r border-blue-500">ชื่อสินค้า</th>
                  <th className="p-2 w-16 text-center border-r border-blue-500">คลัง</th>
                  <th className="p-2 w-16 text-center border-r border-blue-500">ที่เก็บ</th>
                  <th className="p-2 w-28 text-center border-r border-blue-500">หน่วยนับ</th>
                  <th className="p-2 w-20 text-center border-r border-blue-500">จำนวน</th>
                  <th className="p-2 w-24 text-center border-r border-blue-500">ราคา/หน่วย</th>
                  <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด</th>
                  <th className="p-2 w-24 text-center border-r border-blue-500">จำนวนเงิน</th>
                  <th className="p-2 w-24 text-center">
                    <button 
                        type="button" 
                        onClick={handleClearLines} 
                        className="text-white hover:text-red-200 transition-colors"
                        title="ล้างค่าทั้งหมด"
                    >
                        <Eraser size={14} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const lineDiscount = line.discount || 0;
                  const lineTotal = (line.quantity * line.est_unit_price) - lineDiscount;
                  return (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="p-1 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-r border-gray-300 dark:border-gray-600 sticky left-0 z-10">{index + 1}</td>
                      <td className={tdBaseClass}><input value={line.item_code} onChange={(e) => updateLine(index, 'item_code', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                      <td className={tdBaseClass}><input value={line.item_name} onChange={(e) => updateLine(index, 'item_name', e.target.value)} className={tableInputClass} /></td>
                      <td className={tdBaseClass}><input value={line.warehouse || ''} onChange={(e) => updateLine(index, 'warehouse', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                      <td className={tdBaseClass}><input value={line.location || ''} onChange={(e) => updateLine(index, 'location', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                      <td className={tdBaseClass}>
                        <input 
                          type="text"
                          value={line.uom} 
                          onChange={(e) => updateLine(index, 'uom', e.target.value)} 
                          className={`${tableInputClass} text-center`}
                        />
                      </td>
                      <td className={tdBaseClass}><input type="number" value={line.quantity || ''} onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                      <td className={tdBaseClass}><input type="number" value={line.est_unit_price || ''} onChange={(e) => updateLine(index, 'est_unit_price', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                      <td className={tdBaseClass}><input type="number" value={line.discount || ''} onChange={(e) => updateLine(index, 'discount', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                      <td className={`${tdBaseClass} text-right font-bold pr-2 text-gray-700 dark:text-gray-300`}>{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-1">
                        <div className="flex justify-center items-center space-x-2 h-8">
                          <button type="button" className="text-blue-600 hover:text-blue-800 transition-colors" title="ค้นหา" onClick={() => openProductSearch(index)}><Search size={16} /></button>
                          <button type="button" className="text-orange-500 hover:text-orange-700 transition-colors" onClick={() => clearLine(index)} title="ล้างค่า"><Eraser size={16} /></button>
                          <button type="button" className="text-red-500 hover:text-red-700 transition-colors" onClick={() => removeLine(index)} title="ลบ"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3. Footer Section: Add Button */}
          <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={addLine} className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-bold shadow-sm transition-colors"><Plus size={14} className="mr-1" /> เพิ่มรายการ</button>
          </div>
        </div>

        {/* Summary */}
        <div className={cardClass}>
          <div className="p-3 bg-white dark:bg-gray-900">
            <div className="flex justify-end">
              <div className="w-96 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">รวม</span>
                  <input value={subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="w-28 h-7 px-2 text-right bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded text-gray-900 dark:text-yellow-200" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">ส่วนลด</span>
                  <div className="flex items-center gap-2">
                    <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} className="w-16 h-7 px-2 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <span className="text-gray-600 dark:text-gray-400">%</span>
                    <span className="text-gray-600 dark:text-gray-400">=</span>
                    <input value={discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="w-24 h-7 px-2 text-right bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">ภาษี VAT</span>
                  <div className="flex items-center gap-2">
                    <input value={afterDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="w-20 h-7 px-2 text-right bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">ภาษี (%)</span>
                    <input type="number" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} className="w-12 h-7 px-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <span className="text-gray-600 dark:text-gray-400">=</span>
                    <input value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="w-24 h-7 px-2 text-right bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="font-bold text-gray-700 dark:text-gray-300">รวมทั้งสิ้น</span>
                  <input value={grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="w-28 h-7 px-2 text-right font-bold bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-600 rounded text-gray-900 dark:text-yellow-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={cardClass}>
          <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className={tabClass('detail')} onClick={() => setActiveTab('detail')}><FileBox size={14} /> Detail</div>
            <div className={tabClass('more')} onClick={() => setActiveTab('more')}><MoreHorizontal size={14} /> More</div>
            <div className={tabClass('rate')} onClick={() => setActiveTab('rate')}><Flame size={14} /> Rate</div>
            <div className={tabClass('description')} onClick={() => setActiveTab('description')}><FileBarChart size={14} /> Description</div>
            <div className={tabClass('history')} onClick={() => setActiveTab('history')}><HistoryIcon size={14} /> History</div>
          </div>
          <div className="p-3 min-h-[80px] dark:bg-gray-900">
            {activeTab === 'detail' && (
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="กรอกหมายเหตุเพิ่มเติม..." className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
            )}
            {activeTab === 'more' && <div className="text-gray-500 dark:text-gray-400 text-sm">ข้อมูลเพิ่มเติม...</div>}
            {activeTab === 'rate' && <div className="text-gray-500 dark:text-gray-400 text-sm">อัตราแลกเปลี่ยน / ราคา...</div>}
            {activeTab === 'description' && <div className="text-gray-500 dark:text-gray-400 text-sm">รายละเอียดเอกสาร...</div>}
            {activeTab === 'history' && <div className="text-gray-500 dark:text-gray-400 text-sm">ประวัติการแก้ไข...</div>}
          </div>
        </div>
      </div>
    </WindowFormLayout>
  );
};
