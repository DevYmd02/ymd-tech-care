import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, FileBox } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { WindowFormLayout } from '@ui';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { MasterDataService } from '@/modules/master-data';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal } from '@/modules/inventory/components/selector/ProductSearchModal';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';
import type { RFQHeader } from '@/modules/procurement/types';
import { useVQForm } from '@/modules/procurement/pages/vq/hooks/useVQForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRFQ?: RFQHeader | null;
  vqId?: string | null;
  isViewMode?: boolean;
}

const VQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialRFQ, vqId, isViewMode = false }) => {
  // -- Custom Hook --
  const { 
    methods, fields, append, remove, insert, 
    totals, handleSave, updateLineCalculation, vatRate, createEmptyLine 
  } = useVQForm(isOpen, onClose, initialRFQ, onSuccess, vqId, isViewMode);

  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const formData = watch();
  const watchTargetCurrency = watch('target_currency_code') || 'THB';

  // -- UI State --
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

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

  return (
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
          }}
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
                                  value={formData?.vendor_name || ''} 
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
                                  disabled={isViewMode}
                                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  เลือก
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  {/* Multicurrency Control Panel */}
                  <div className="pt-6 border-t border-gray-100 dark:border-slate-800/50">
                      <MulticurrencyWrapper 
                          control={control}
                          name="is_multicurrency"
                          disabled={isViewMode}
                      >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="col-span-1 lg:col-span-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">สกุลเงิน (Currency)</label>
                                  <select 
                                      {...register('target_currency_code')} 
                                      className="w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:bg-gray-50 focus:border-transparent dark:text-white transition-all cursor-pointer"
                                      disabled={isViewMode}
                                  >
                                      <option value="THB">THB - Thai Baht</option>
                                      <option value="USD">USD - US Dollar</option>
                                      <option value="EUR">EUR - Euro</option>
                                      <option value="JPY">JPY - Japanese Yen</option>
                                      <option value="SGD">SGD - Singapore Dollar</option>
                                  </select>
                              </div>
                              <div className="col-span-1">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">วันที่อ้างอิงอัตราแลกเปลี่ยน</label>
                                  <input 
                                      type="date" 
                                      {...register('exchange_rate_date')} 
                                      className="w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:bg-gray-50 focus:border-transparent dark:text-white transition-all"
                                      disabled={isViewMode}
                                  />
                              </div>
                              <div className="col-span-1">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">อัตราแลกเปลี่ยน ({watchTargetCurrency}/THB)</label>
                                  <input 
                                      type="number" 
                                      step="0.0001"
                                      {...register('exchange_rate', { valueAsNumber: true })} 
                                      className="w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:bg-gray-50 focus:border-transparent dark:text-white transition-all text-right"
                                      disabled={isViewMode}
                                      placeholder="1.0000"
                                  />
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
                  <table className="w-full min-w-[1200px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                      <thead className="bg-indigo-700 text-white text-xs dark:bg-indigo-900">
                          <tr>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-14">ลำดับ</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-36">รหัสสินค้า</th>
                              <th className="px-3 py-2 text-left font-medium border-r border-indigo-600 dark:border-indigo-800">รายละเอียด</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">คลัง</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">ตำแหน่ง</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">จำนวน</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">หน่วย</th>
                              <th className="px-3 py-2 text-right font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ราคา/หน่วย</th>
                              <th className="px-3 py-2 text-right font-medium border-r border-indigo-600 dark:border-indigo-800 w-28">ส่วนลด</th>
                              <th className="px-3 py-2 text-right font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ยอดรวม</th>
                              <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-20">ไม่เสนอราคา</th>
                              {!isViewMode && <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-16">จัดการ</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {fields.map((field, idx) => {
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
                                     
                                     {/* Warehouse */}
                                      <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                          <input 
                                              type="text" 
                                              {...register(`lines.${idx}.warehouse`)} 
                                              readOnly={isViewMode} 
                                              className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                                              placeholder="MAIN" 
                                          />
                                      </td>
                                      
                                      {/* Location */}
                                      <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                          <input 
                                              type="text" 
                                              {...register(`lines.${idx}.location`)} 
                                              readOnly={isViewMode} 
                                              className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                                              placeholder="A-1" 
                                          />
                                      </td>
                                     
                                     {/* Qty */}
                                     <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                         <input 
                                            type="number" step="any"
                                            {...register(`lines.${idx}.qty`, { 
                                                valueAsNumber: true, 
                                                onChange: (e) => updateLineCalculation(idx, 'qty', parseFloat(e.target.value))
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
                                                {units.map(u => (
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
                                                onChange: (e) => updateLineCalculation(idx, 'unit_price', parseFloat(e.target.value))
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
                                                onChange: (e) => updateLineCalculation(idx, 'discount_amount', parseFloat(e.target.value))
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
                                                  onChange: (e) => updateLineCalculation(idx, 'no_quote', e.target.checked)
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

          {/* Summaries Panel */}
          <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-b-lg flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">มูลค่าสินค้า (Sub Total)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">ภาษีมูลค่าเพิ่ม (VAT {vatRate}%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                      <span className="font-bold text-sm text-indigo-800 dark:text-indigo-300">ยอดรวมสุทธิ (Grand Total)</span>
                      <span className="font-bold text-base text-indigo-700 dark:text-indigo-400">{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
              </div>
          </div>
          
          {/* 3. Remarks Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm mt-4">
              <div className="p-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3 text-indigo-600 dark:text-indigo-400">
                      <FileBox size={18} />
                      <span className="font-semibold text-sm">หมายเหตุ (Remarks VQ)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">หมายเหตุถึงผู้ขาย (Remark to Vendor)</label>
                          <textarea 
                              {...register('remark')} 
                              rows={2}
                              className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all resize-none ${isViewMode ? 'opacity-70 cursor-not-allowed bg-gray-100/70' : ''}`} 
                              disabled={isViewMode}
                              placeholder="ระบุข้อความ..."
                          />
                      </div>
                  </div>
              </div>
          </div>

      </div>
    </WindowFormLayout>
  );
};

export default VQFormModal;