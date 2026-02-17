import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, MoreHorizontal, FileBox } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@/core/api/master-data.service';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { ProductSearchModal } from '@/modules/inventory/components/selector/ProductSearchModal';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';
import type { RFQHeader } from '@/modules/procurement/types/rfq-types';
import { useQTForm } from '@/modules/procurement/pages/qt/hooks/useQTForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRFQ?: RFQHeader | null;
}

const QTFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialRFQ }) => {
  // -- Custom Hook --
  const { 
    methods, fields, append, remove, insert, 
    totals, handleSave, updateLineCalculation, vatRate, createEmptyLine 
  } = useQTForm(isOpen, onClose, initialRFQ, onSuccess);

  const { register, control, setValue, formState: { errors } } = methods;

  // -- UI State --
  const [activeTab, setActiveTab] = useState('detail');
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm';
  const tabClass = (tab: string) => `px-6 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`;

  // Helper to watch net_amount for display (since it's calculated)
  // We can't easily map over 'fields' and get live values without watching.
  // Ideally, useFieldArray with useWatch or <Controller>. 
  // For simplicity in this dense table, we'll use a specific Watcher component or just rely on react-hook-form re-renders if we watch 'lines'.
  // But watching 'lines' causes full re-render. 
  // Optimization: Create a sub-component for LineItem or just accept re-renders for now (lines <= 20).
  const watchedLines = useWatch({ control, name: 'lines' });

  return (
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างใบเสนอราคา (Create Quotation) - Refactored"
      titleIcon={<div className="bg-blue-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} className="text-white" /></div>}
      headerColor="bg-blue-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
      footer={
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors">
                ยกเลิก
            </button>
            <button type="button" onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors">
                บันทึก
            </button>
        </div>
      }
    >
      {/* Alert removed - now using toast */}

      <ProductSearchModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={selectProduct}
      />

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0b1120] p-4 space-y-4">
          
          {/* 1. Header Card */}
          <div className={cardClass}>
              <div className="p-5 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><FileText size={20} /></div>
                      <span className="font-bold text-lg">ส่วนหัวใบเสนอราคา</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลขที่ใบเสนอราคา *</label>
                          <input {...register('quotation_no')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">วันที่ใบเสนอราคา *</label>
                          <input type="date" {...register('quotation_date')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" />
                          {errors.quotation_date && <span className="text-xs text-red-500">{errors.quotation_date.message}</span>}
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลขที่ RFQ อ้างอิง</label>
                          <input {...register('qc_id')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800/50" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">วันที่ใช้ได้ถึง *</label>
                          <input type="date" {...register('valid_until')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" />
                          {errors.valid_until && <span className="text-xs text-red-500">{errors.valid_until.message}</span>}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">รหัสเจ้าหนี้ *</label>
                          <div className="flex gap-2">
                              <input {...register('vendor_id')} placeholder="V001" className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" />
                              <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md">
                                  <Search size={18} />
                              </button>
                          </div>
                          {errors.vendor_id && <span className="text-xs text-red-500">{errors.vendor_id.message}</span>}
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ชื่อเจ้าหนี้</label>
                          <input {...register('vendor_name')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800/50" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ผู้ติดต่อ</label>
                          <input {...register('contact_person')} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" />
                      </div>
                  </div>
                  
                  {/* Additional fields */}
              </div>
          </div>

          {/* 2. Items Table */}
          <div className={cardClass}>
              <div className="p-5 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><FileText size={20} /></div>
                      <span className="font-bold text-lg">รายการสินค้า</span>
                  </div>
                  
                  <div className="overflow-x-auto bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                     <table className="w-full min-w-[1000px] border-collapse bg-white dark:bg-[#1e1e1e] text-sm">
                         <thead className="bg-gray-100 dark:bg-blue-900 border-b-2 border-blue-600/50 text-gray-700 dark:text-blue-100">
                             <tr>
                                 <th className="p-3 w-12 text-center">#</th>
                                 <th className="p-3 w-48 text-center">รหัสสินค้า</th>
                                 <th className="p-3 min-w-[200px] text-center">รายละเอียดสินค้า</th>
                                 <th className="p-3 w-24 text-center">จำนวน</th>
                                 <th className="p-3 w-28 text-center">หน่วยนับ</th>
                                 <th className="p-3 w-32 text-center">ราคา/หน่วย</th>
                                 <th className="p-3 w-24 text-center">ส่วนลด</th>
                                 <th className="p-3 w-32 text-center">ยอดรวม</th>
                                 <th className="p-3 w-24 text-center">จัดการ</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                             {fields.map((field, idx) => (
                                 <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors">
                                     <td className="p-2 text-center text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-800">{idx + 1}</td>
                                     
                                     {/* Item Code */}
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <div className="flex items-center gap-1">
                                            <input {...register(`lines.${idx}.item_code`)} className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded" />
                                            <button type="button" onClick={() => openProductSearch(idx)} className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm">
                                                <Search size={16} />
                                            </button>
                                         </div>
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input {...register(`lines.${idx}.item_name`)} className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded" />
                                     </td>
                                     
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" step="any"
                                            {...register(`lines.${idx}.qty`, { 
                                                valueAsNumber: true, 
                                                onChange: (e) => updateLineCalculation(idx, 'qty', parseFloat(e.target.value))
                                            })} 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-center text-blue-600 dark:text-blue-400 font-medium" 
                                         />
                                     </td>
                                     
                                     {/* Unit Dropdown */}
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                        <select {...register(`lines.${idx}.uom_name`)} className="w-full h-9 px-2 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-center cursor-pointer">
                                            <option value="" hidden>เลือก</option>
                                            {units.map(u => (
                                                <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>
                                            ))}
                                        </select>
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" step="any"
                                            {...register(`lines.${idx}.unit_price`, { 
                                                valueAsNumber: true,
                                                onChange: (e) => updateLineCalculation(idx, 'unit_price', parseFloat(e.target.value))
                                            })} 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-right" 
                                         />
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" step="any"
                                            {...register(`lines.${idx}.discount_amount`, { 
                                                valueAsNumber: true,
                                                onChange: (e) => updateLineCalculation(idx, 'discount_amount', parseFloat(e.target.value))
                                            })} 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-right" 
                                         />
                                     </td>
                                     
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            value={(watchedLines[idx]?.net_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} 
                                            readOnly 
                                            className="w-full h-9 px-3 bg-gray-50 dark:bg-[#1e1e1e] border border-transparent rounded text-right text-emerald-600 dark:text-emerald-500 font-bold focus:outline-none" 
                                         />
                                     </td>
                                     
                                     <td className="p-2 text-center">
                                         <div className="flex items-center justify-center gap-2">
                                             <button type="button" onClick={() => insert(idx + 1, createEmptyLine())} className="text-green-500 hover:text-green-400 p-1"><Plus size={18} /></button>
                                             <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     
                     <div className="mt-4 flex justify-between items-center px-1">
                        <button type="button" onClick={() => append(createEmptyLine())} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-blue-900/30 hover:bg-gray-200 text-blue-600 dark:text-blue-400 font-bold rounded border border-gray-300 dark:border-blue-800">
                            <Plus size={14} strokeWidth={3}/> Add Line
                        </button>
                     </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-right bg-blue-50 dark:bg-gray-800/50 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-300 text-sm font-bold mr-4 uppercase tracking-wide">ยอดรวมทั้งสิ้น</span>
                          <div className="flex items-baseline justify-end gap-2 mt-1">
                              <span className="text-3xl font-extrabold text-[#1d4ed8] dark:text-blue-400">{totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">THB</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 3. Footer Summary */}
          <div className={cardClass}>
              <div className="p-4 bg-white dark:bg-gray-900 flex justify-end">
                  <div className="w-80 space-y-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">รวมเป็นเงิน (Subtotal)</span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">{totals.subtotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ภาษีมูลค่าเพิ่ม ({vatRate}%)</span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">{totals.vatAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                          <span className="font-bold text-gray-800 dark:text-white text-lg">ยอดรวมทั้งสิ้น (Grand Total)</span>
                          <span className="font-extrabold text-[#1d4ed8] dark:text-blue-400 text-xl">{totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Tabs - Remarks */}
          <div className={cardClass}>
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className={tabClass('detail')} onClick={() => setActiveTab('detail')}><FileBox size={14} /> Note</div>
                  <div className={tabClass('more')} onClick={() => setActiveTab('more')}><MoreHorizontal size={14} /> More</div>
              </div>
              <div className="p-4 min-h-[100px] bg-white dark:bg-gray-900">
                  {activeTab === 'detail' && (
                      <textarea {...register('remarks')} placeholder="กรอกหมายเหตุเพิ่มเติม..." className="w-full h-24 px-4 py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none" />
                  )}
                  {activeTab === 'more' && <div className="text-gray-500 dark:text-gray-400 text-sm italic">ข้อมูลเพิ่มเติม...</div>}
              </div>
          </div>

      </div>
    </WindowFormLayout>
  );
};

export default QTFormModal;


