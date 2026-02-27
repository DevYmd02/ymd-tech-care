import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, X as XIcon } from 'lucide-react';
import { FormProvider, Controller, useWatch } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { MasterDataService } from '@/modules/master-data';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal } from '@/modules/inventory/components/selector/ProductSearchModal';
import { useVQForm } from '../hooks/useVQForm';
import { RFQSelectorModal } from './RFQSelectorModal';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { RFQHeader } from '@/modules/procurement/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRFQ?: RFQHeader | null;
  vqId?: string | null;
  isViewMode?: boolean;
}

const VQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialRFQ, vqId, isViewMode = false }) => {
  const { toast } = useToast();
  // -- Custom Hook --
  const { 
    methods, fields, append, remove, insert, 
    totals, handleSave, updateLineCalculation, 
    handleSelectRFQ, handleClearRFQ,
    createEmptyLine,
    purchaseTaxOptions
  } = useVQForm(isOpen, onClose, initialRFQ, onSuccess, vqId, isViewMode);

  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors }
  } = methods;

  const discountRaw = watch('discount_raw') ?? '';

  const inputReadonlyClass = 'h-7 px-2 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white';
  const inputEditableClass = 'h-7 px-2 text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500';
  const labelClass = 'text-gray-600 dark:text-gray-400 min-w-16';

  const {
      subtotal,
      discountAmount,
      vatAmount,
      grandTotal,
      totalLineDiscount
  } = totals;

  const watchVendorName = useWatch({ control, name: 'vendor_name' });
  const watchCurrency = useWatch({ control, name: 'currency' });
  const watchExchangeRate = useWatch({ control, name: 'exchange_rate' });

  // -- UI State --
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('detail');

  // -- Effects --
  useEffect(() => {
    if (isOpen) {
      MasterDataService.getUnits().then(setUnits);
    }
  }, [isOpen]);

  // -- Handlers --
  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsProductModalOpen(true);
  };

  const selectProduct = (product: ProductLookup) => {
    if (activeRowIndex !== null) {
      setValue(`lines.${activeRowIndex}.item_code`, product.item_code);
      setValue(`lines.${activeRowIndex}.item_name`, product.item_name);
      setValue(`lines.${activeRowIndex}.uom_name`, product.unit);
      setValue(`lines.${activeRowIndex}.unit_price`, product.unit_price);
      setValue(`lines.${activeRowIndex}.qty`, 1);
      
      // Trigger calculation
      updateLineCalculation(activeRowIndex, 'qty', 1);
      
      setIsProductModalOpen(false);
    }
  };

  // -- Rendering Helpers --
  const watchedLines = useWatch({ control, name: 'lines' });

  const onSelectRFQ = async (rfq: RFQHeader) => {
    try {
      // Step 1: Populate form data
      const rfqNo = await handleSelectRFQ(rfq);
      
      // Step 2: Close modal instantly
      setIsRFQModalOpen(false);
      
      // Step 3: Trigger success toast after closure
      if (rfqNo) {
        toast(`ดึงข้อมูลจาก RFQ ${rfqNo} เรียบร้อยแล้ว`, 'success');
      }
    } catch {
      // Handle potential crash or error
      setIsRFQModalOpen(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title={isViewMode ? "รายละเอียดใบเสนอราคาจากผู้ขาย (View Vendor Quotation - VQ)" : "ใบเสนอราคาจากผู้ขาย (Vendor Quotation - VQ)"}
        titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} className="text-white" /></div>}
        headerColor="bg-indigo-600"
        footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors">
                  {isViewMode ? 'ปิด' : 'ยกเลิก'}
              </button>
              {!isViewMode && (
                  <button type="button" onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors">
                      บันทึก
                  </button>
              )}
          </div>
        }
      >
        {/* Alert removed - now using toast */}

        <ProductSearchModal 
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSelect={selectProduct}
        />

        <VendorSearchModal 
            isOpen={isVendorModalOpen}
            onClose={() => setIsVendorModalOpen(false)}
            onSelect={(vendor) => {
                setValue('vendor_id', vendor.vendor_id);
                setValue('vendor_name', vendor.name);
                // contact_person omitted as it's not in VendorSearchItem
                setValue('contact_phone', vendor.phone || '');
                setValue('contact_email', vendor.email || '');
                setValue('payment_terms', vendor.payment_term_days ? `${vendor.payment_term_days} วัน` : '');
                setIsVendorModalOpen(false);
            }}
        />

        <RFQSelectorModal 
            isOpen={isRFQModalOpen}
            onClose={() => setIsRFQModalOpen(false)}
            onSelect={onSelectRFQ}
        />

      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
          
          {/* 1. Header Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <FileText size={18} />
                      <span className="font-semibold">ส่วนหัวเอกสาร - Header VQ (Vendor Quotation)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เลขที่ใบเสนอราคา <span className="text-red-500">*</span></label>
                          <input type="text" {...register('quotation_no')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={isViewMode} />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ระบบจะแสดงอัตโนมัติเมื่อบันทึก</p>
                      </div>
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">วันที่ใบเสนอราคา <span className="text-red-500">*</span></label>
                          <input type="date" {...register('quotation_date')} className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${errors.quotation_date ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`} disabled={isViewMode} />
                          {errors.quotation_date && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.quotation_date.message}</p>}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">วันที่ออกเอกสารใบเสนอราคา</p>
                      </div>
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">วันที่ใช้ได้ถึง (Valid Until) <span className="text-red-500">*</span></label>
                          <input type="date" {...register('valid_until')} className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${errors.valid_until ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`} disabled={isViewMode} />
                          {errors.valid_until && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.valid_until.message}</p>}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">วันหมดอายุของใบเสนอราคา</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-2">
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ชื่อผู้ขาย (Vendor) <span className="text-red-500">*</span></label>
                          <div className="flex gap-2">
                              <input 
                                  {...register('vendor_id')} 
                                  placeholder="V001..." 
                                  className={`w-32 h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${errors.vendor_id ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`} 
                                  disabled={isViewMode} 
                                  readOnly 
                              />
                              <input 
                                  type="text" 
                                  value={watchVendorName || ''} 
                                  readOnly 
                                  className="flex-1 h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
                                  placeholder="ชื่อบริษัท/ผู้ขาย" 
                              />
                              <button 
                                  type="button" 
                                  onClick={() => !isViewMode && setIsVendorModalOpen(true)}
                                  disabled={isViewMode}
                                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                  <Search size={14} /> เลือก
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ผู้ติดต่อ (Contact Person)</label>
                          <input type="text" {...register('contact_person')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={isViewMode} />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">โทรศัพท์ (Phone)</label>
                          <input type="text" {...register('contact_phone')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={isViewMode} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">อีเมล (Email)</label>
                          <input type="email" {...register('contact_email')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={isViewMode} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เงื่อนไขการชำระ (Payment Terms)</label>
                          <input type="text" {...register('payment_terms')} placeholder="เช่น 30 วัน, เงินสด" className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={isViewMode} />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ระยะเวลานำส่ง (Lead Time / Days)</label>
                          <input type="number" {...register('delivery_days')} className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={isViewMode} />
                      </div>
                      <div className="md:col-span-2">
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เลขที่ RFQ อ้างอิง</label>
                          <div className="flex gap-2">
                              <input {...register('qc_id')} className="flex-1 h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={isViewMode} />
                              <button 
                                  type="button"
                                  onClick={() => !isViewMode && setIsRFQModalOpen(true)}
                                  disabled={isViewMode}
                                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                  <Search size={14} /> เลือก
                              </button>
                              {useWatch({ control, name: 'qc_id' }) && !isViewMode && (
                                <button 
                                    type="button"
                                    onClick={handleClearRFQ}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800/50"
                                    title="ล้างข้อมูล RFQ อ้างอิง"
                                >
                                    <XIcon size={14} />
                                </button>
                              )}
                          </div>
                      </div>
                  </div>
                  
                  {/* Multicurrency Control Panel */}
                  <div className="pt-6 border-t border-gray-100 dark:border-slate-800/50">
                      <MulticurrencyWrapper 
                          control={control}
                          name="isMulticurrency"
                          disabled={isViewMode}
                      >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                                  <input 
                                      type="date" 
                                      {...register('exchange_rate_date')} 
                                      className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow"
                                      disabled={isViewMode}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                                  <select 
                                      {...register('currency')} 
                                      className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                      disabled={isViewMode}
                                  >
                                      <option value="THB">THB - บาท</option>
                                      <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                      <option value="EUR">EUR - ยูโร</option>
                                      <option value="JPY">JPY - เยน</option>
                                      <option value="SGD">SGD - ดอลลาร์สิงคโปร์</option>
                                      <option value="CNY">CNY - หยวน</option>
                                  </select>
                                  {errors.currency && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.currency.message}</p>}
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                                  <select 
                                      {...register('target_currency')} 
                                      className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                      disabled={isViewMode}
                                  >
                                      <option value="THB">THB - บาท</option>
                                      <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                                  <input 
                                      type="number" 
                                      step="0.0001"
                                      {...register('exchange_rate', { valueAsNumber: true })} 
                                      className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${watchCurrency === 'THB' || isViewMode ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
                                      disabled={isViewMode || watchCurrency === 'THB'}
                                      placeholder="1.0000"
                                  />
                                  {watchCurrency && watchCurrency !== 'THB' && (
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                                        1 {watchCurrency} ≈ {Number(watchExchangeRate || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                                    </div>
                                  )}
                                  {errors.exchange_rate && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.exchange_rate.message}</p>}
                              </div>
                          </div>
                      </MulticurrencyWrapper>
                  </div>
              </div>
          </div>

          {/* 2. Line Items Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <FileText size={18} />
                          <span className="font-semibold">รายการสินค้า - Line VQ (Vendor Quotation)</span>
                      </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <table className="w-full min-w-[1000px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                      <thead className="bg-indigo-700 text-white text-xs dark:bg-indigo-900">
                          <tr>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-14">ลำดับ</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-44">รหัสสินค้า</th>
                              <th className="px-3 py-2 text-left font-medium border-r border-indigo-600 dark:border-indigo-800">รายละเอียด</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">จำนวน</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">หน่วย</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ราคา/หน่วย</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-28">ส่วนลด</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ยอดรวม</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-20 whitespace-nowrap">ไม่เสนอราคา</th>
                              {!isViewMode && <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-16">จัดการ</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {fields.map((field, idx: number) => {
                              const isNoQuote = watchedLines[idx]?.no_quote;
                                 return (
                                 <tr key={field.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${isNoQuote ? 'bg-amber-50 dark:bg-amber-950/10' : ''}`}>
                                     <td className="px-3 py-2 text-center text-xs text-gray-700 dark:text-gray-300 border-r border-b border-gray-200 dark:border-gray-700">{idx + 1}</td>
                                     
                                      {/* Item Code */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        {(initialRFQ || isViewMode) ? (
                                            <div className="relative">
                                                <input {...register(`lines.${idx}.item_code`)} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                                    <Search size={14} />
                                                </div>
                                            </div>
                                        ) : (
                                         <div className="relative group/search">
                                            <input {...register(`lines.${idx}.item_code`)} className="w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" />
                                            <button type="button" onClick={() => openProductSearch(idx)} className="absolute right-1 top-1 h-[24px] w-[24px] flex items-center justify-center bg-gray-200 dark:bg-slate-700 group-hover/search:bg-indigo-600 dark:group-hover/search:bg-indigo-600 text-gray-600 group-hover/search:text-white dark:text-white rounded transition-all duration-200">
                                                <Search size={14} />
                                            </button>
                                         </div>
                                        )}
                                      </td>
 
                                      {/* Item Description */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                         <input {...register(`lines.${idx}.item_name`)} className={`w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-left cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors`} readOnly={!!initialRFQ || isViewMode} />
                                     </td>
                                     
                                     {/* Qty */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                         <input 
                                            type="number" step="any"
                                            {...register(`lines.${idx}.qty`, { 
                                                valueAsNumber: true, 
                                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateLineCalculation(idx, 'qty', parseFloat(e.target.value))
                                            })} 
                                            className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed ${(initialRFQ || isViewMode) ? 'bg-gray-100/70 dark:bg-gray-800/70 cursor-not-allowed font-medium' : ''}`} 
                                            readOnly={!!initialRFQ || isViewMode}
                                         />
                                     </td>
                                     
                                     {/* Unit */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                        {(initialRFQ || isViewMode) ? (
                                            <input
                                                type="text"
                                                {...register(`lines.${idx}.uom_name`)}
                                                className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                                readOnly
                                            />
                                        ) : (
                                            <select {...register(`lines.${idx}.uom_name`)} className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50">
                                                <option value="" hidden>หน่วย</option>
                                                {units.map((u: UnitListItem) => (
                                                    <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>
                                                ))}
                                            </select>
                                        )}
                                      </td>

                                     {/* Unit Price */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                         <input 
                                            type="number" step="any" disabled={isNoQuote || isViewMode}
                                            {...register(`lines.${idx}.unit_price`, { 
                                                valueAsNumber: true,
                                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateLineCalculation(idx, 'unit_price', parseFloat(e.target.value))
                                            })} 
                                            className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-right transition-all ${(isNoQuote || isViewMode) ? 'opacity-70 cursor-not-allowed disabled:bg-gray-50' : ''}`} 
                                            placeholder="0.00"
                                         />
                                     </td>
 
                                     {/* Discount Amount */}
                                     <td className="px-4 py-3 text-right border-r border-gray-200 dark:border-gray-700">
                                         <input 
                                            type="number" step="any" disabled={isNoQuote || isViewMode}
                                            {...register(`lines.${idx}.discount_amount`, { 
                                                valueAsNumber: true,
                                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateLineCalculation(idx, 'discount_amount', parseFloat(e.target.value))
                                            })} 
                                            className={`w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-indigo-500 transition-all ${(isNoQuote || isViewMode) ? 'opacity-70 cursor-not-allowed bg-gray-100/70 text-gray-600 dark:bg-slate-800/20' : ''}`} 
                                            placeholder="0.00"
                                         />
                                     </td>
                                     
                                     {/* Net Amount */}
                                     <td className="p-3 text-right pr-6 border-r border-gray-200 dark:border-gray-700">
                                         <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                            {(watchedLines[idx]?.net_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} 
                                         </span>
                                     </td>
                                     
                                     {/* No Quote Toggle */}
                                     <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                                          <input
                                              type="checkbox"
                                              {...register(`lines.${idx}.no_quote`, {
                                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateLineCalculation(idx, 'no_quote', e.target.checked)
                                              })} 
                                              className={`w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                              disabled={isViewMode}
                                          />
                                      </td>

                                     {/* Actions */}
                                     {!isViewMode && (
                                        <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => insert(idx + 1, createEmptyLine())}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                    title="เพิ่มบรรทัดใหม่"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(idx)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                                                    title="ลบบรรทัด"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                      )}
                                 </tr>
                                 );
                             })}
                      </tbody>
                  </table>
              </div>

              {/* Add Row Section */}
              {!isViewMode && (
                <div className="bg-slate-100 dark:bg-slate-800/20 border-t border-gray-300 dark:border-slate-800 p-4">
                    <button
                        type="button"
                        onClick={() => append(createEmptyLine())}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-1 rounded">
                            <Plus size={16} />
                        </div>
                        เพิ่มรายการสินค้า (Add Row)
                    </button>
                </div>
              )}
              </div>
          </div>

          {/* --- TOTAL SUMMARY & CALCULATIONS --- */}
          <div className="mt-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden">
                  <div className="p-3 bg-white dark:bg-gray-900">
                      <div className="flex justify-end">
                          <div className="w-full md:w-[400px] space-y-2 text-sm">

                              {/* รวม (Subtotal) */}
                              <div className="flex justify-between items-center">
                                  <span className={labelClass}>รวม</span>
                                  <input 
                                      value={subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                      readOnly 
                                      className={`w-32 ${inputReadonlyClass} bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-600 text-slate-800 dark:text-yellow-200 font-medium`} 
                                  />
                              </div>
                              
                              {/* ส่วนลดท้ายบิล (Discount) — 3 fields */}
                              <div className="flex justify-between items-center">
                                  <span className={labelClass}>ส่วนลด</span>
                                  <div className="flex items-center gap-1">
                                      {/* Field 1: Editable — user types number or % */}
                                      <input 
                                          type="text"
                                          value={discountRaw} 
                                          onChange={(e) => setValue('discount_raw', e.target.value)} 
                                          placeholder="0 or 5%"
                                          disabled={isViewMode}
                                          className={`w-24 ${inputEditableClass} ${isViewMode ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed text-gray-500' : 'text-slate-900 dark:text-white font-medium'}`} 
                                      />
                                      <span className="text-gray-400 dark:text-gray-500">-</span>
                                      {/* Field 2: Read-only — calculated discount amount from this input */}
                                      <input 
                                          value={discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                          readOnly 
                                          className={`w-24 ${inputReadonlyClass}`} 
                                      />
                                      <span className="text-gray-400 dark:text-gray-500">-</span>
                                      {/* Field 3: Read-only — total discount (line discounts + global discount) */}
                                      <input 
                                          value={(totalLineDiscount + discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                          readOnly 
                                          className={`w-28 ${inputReadonlyClass} text-red-600 dark:text-red-400 font-bold`} 
                                      />
                                  </div>
                              </div>

                              {/* ภาษี VAT */}
                              <div className="flex justify-between items-center">
                                  <span className={labelClass}>ภาษี VAT</span>
                                  <div className="flex items-center gap-1">
                                      <input 
                                          value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                          readOnly 
                                          className={`w-20 ${inputReadonlyClass}`} 
                                      />
                                      {/* Tax Code Select */}
                                      <Controller
                                          name="tax_code_id"
                                          control={control}
                                          render={({ field }) => (
                                              <select
                                                  {...field}
                                                  value={field.value ? String(field.value) : ''}
                                                  disabled={isViewMode}
                                                  onChange={(e) => {
                                                      const val = e.target.value;
                                                      const selected = purchaseTaxOptions.find(t => String(t.value) === val);
                                                      field.onChange(selected ? selected.value : val);
                                                  }}
                                                  className={`h-7 px-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px] ${isViewMode ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-70' : ''}`}
                                              >
                                                  <option value="">เลือกภาษี</option>
                                                  {purchaseTaxOptions.map(tax => (
                                                      <option key={tax.value} value={tax.value}>
                                                          {tax.label}
                                                      </option>
                                                  ))}
                                              </select>
                                          )}
                                      />
                                      <span className="text-gray-400 dark:text-gray-500">-</span>
                                      <input 
                                          value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                          readOnly 
                                          className={`w-24 ${inputReadonlyClass} bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-medium`} 
                                      />
                                  </div>
                              </div>

                              {/* รวมทั้งสิ้น (Grand Total) */}
                              <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                                  <span className="font-bold text-gray-700 dark:text-gray-300">รวมทั้งสิ้น</span>
                                  <input 
                                      value={grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                      readOnly 
                                      className="w-32 h-8 px-2 text-right font-bold bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-600 rounded text-blue-600 dark:text-yellow-200" 
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* 3. Remarks Section */}
          <SharedRemarksTab
              activeTab={activeTab}
              onTabChange={setActiveTab}
              register={register('remark')}
              readOnly={isViewMode}
              className="mt-4"
              placeholder="ระบุข้อความ..."
          />

      </div>
      </WindowFormLayout>
    </FormProvider>
  );
};

export default VQFormModal;