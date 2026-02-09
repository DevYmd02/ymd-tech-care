import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Printer, Copy, CheckCircle, FileBox, MoreHorizontal, Coins, FileBarChart, History as HistoryIcon } from 'lucide-react';
import { PRHeader } from './PRHeader';
import { mockBranches } from '@/modules/master-data/mocks/masterDataMocks';
import { PRFormLines } from './PRFormLines';
import { PRFormSummary } from './PRFormSummary';
import { WindowFormLayout } from '@/shared/components/layout/WindowFormLayout';
import { SystemAlert } from '@/shared/components/ui/SystemAlert';
import { usePRForm } from '@/modules/procurement/hooks/usePRForm';
import { fetchExchangeRate } from '@/modules/procurement/services/mockExchangeRateService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  onSuccess?: () => void;
}

export const PRFormModal: React.FC<Props> = ({ isOpen, onClose, id, onSuccess }) => {
  const {
    isEditMode, lines, discountPercent, setDiscountPercent,
    vatRate, setVatRate, deliveryDate, setDeliveryDate,
    creditDays, vendorQuoteNo, setVendorQuoteNo, shippingMethod, setShippingMethod,
    requesterName, isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    register, handleSubmit, setValue, watch, isSubmitting, isActionLoading,
    alertState, setAlertState, products, costCenters, projects,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, subtotal, discountAmount,
    vatAmount, grandTotal, handleVendorSelect, onSubmit, handleDelete, handleApprove
  } = usePRForm(isOpen, onClose, id, onSuccess);

  // Auto-fetch exchange rate when currency changes
  const currencyId = watch('currency_id');
  useEffect(() => {
     if (currencyId) {
         fetchExchangeRate(currencyId).then(rate => {
             setValue('exchange_rate', rate);
         });
     }
  }, [currencyId, setValue]);

  // Tabs state
  const [activeTab, setActiveTab] = useState('detail');
  const [remarks, setRemarks] = useState('');

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
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
            <div className="flex items-center gap-2">
                 {isEditMode && (
                    <>
                        <button type="button" onClick={handleDelete} disabled={isSubmitting || isActionLoading} className="flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-sm font-medium"><Trash2 size={16} className="mr-2" /> ลบเอกสาร</button>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium"><Printer size={16} className="mr-2" /> พิมพ์</button>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium"><Copy size={16} className="mr-2" /> คัดลอก</button>
                    </>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} disabled={isSubmitting || isActionLoading} className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-sm font-medium">ยกเลิก</button>
                {isEditMode && (
                    <button type="button" onClick={handleApprove} disabled={isSubmitting || isActionLoading} className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium flex items-center gap-2"><CheckCircle size={16} /> อนุมัติ</button>
                )}
                <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isActionLoading} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium">บันทึก</button>
            </div>
        </div>
      }
    >
      {alertState.show && <SystemAlert message={alertState.message} onClose={() => setAlertState({ ...alertState, show: false })} />}
      
      {/* Enhanced Product Search Modal */}
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
          <PRHeader register={register} setValue={setValue} watch={watch} costCenters={costCenters} projects={projects} branches={mockBranches} onVendorSelect={handleVendorSelect} />
        </div>

        <div className={cardClass}>
            <div className="w-full overflow-x-auto border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                <table className="w-full min-w-[800px] text-xs">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-2 py-1.5 text-left border-r border-blue-500 w-48">วันที่กำหนดส่ง</th>
                      <th className="px-2 py-1.5 text-left border-r border-blue-500 w-24">เครดิต (วัน)</th>
                      <th className="px-2 py-1.5 text-left border-r border-blue-500">Vendor Quote No.</th>
                      <th className="px-2 py-1.5 text-left border-r border-blue-500">ขนส่งโดย</th>
                      <th className="px-2 py-1.5 text-left">ผู้จัดทำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white dark:bg-gray-800">
                      <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700"><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1" /></td>
                      <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700 text-center text-gray-900 dark:text-white">{creditDays}</td>
                      <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700"><input value={vendorQuoteNo} onChange={(e) => setVendorQuoteNo(e.target.value)} placeholder="Quote No" className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1" /></td>
                      <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700"><select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1"><option value="รถยนต์">รถยนต์</option><option value="รถบรรทุก">รถบรรทุก</option></select></td>
                      <td className="px-2 py-1 text-gray-900 dark:text-white">{requesterName}</td>
                    </tr>
                  </tbody>
                </table>
            </div>

        </div>

        {/* Multicurrency Section (Middle) */}
        <div className={`p-4 ${cardClass}`}>
            <div className="space-y-4">
                <div className="flex items-center mb-2">
                     <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Coins size={16} className="text-yellow-500" /> 
                        ข้อมูลสกุลเงินและอัตราแลกเปลี่ยน (Currency & Rate)
                     </h3>
                </div>
                
                {/* Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                        <input 
                            type="date" 
                            {...register('rate_date')}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                        <select 
                            value={watch('currency_id')} 
                            onChange={(e) => setValue('currency_id', e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="THB">THB - บาท</option>
                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                            <option value="EUR">EUR - ยูโร</option>
                            <option value="JPY">JPY - เยน</option>
                            <option value="CNY">CNY - หยวน</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสประเภทอัตราแลกเปลี่ยน</label>
                        <select 
                            {...register('currency_type_id')}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">เลือกประเภทอัตราแลกเปลี่ยน</option>
                            <option value="BUYING">Buying Rate</option>
                            <option value="SELLING">Selling Rate</option>
                            <option value="AVERAGE">Average Rate</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                        <input 
                            type="number"
                            step="0.0001"
                            {...register('exchange_rate', { valueAsNumber: true })}
                            className="w-full h-9 px-3 text-sm text-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                         {watch('currency_id') && watch('currency_id') !== 'THB' && (
                           <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right">
                              1 {watch('currency_id')} ≈ {Number(watch('exchange_rate') || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                           </div>
                        )}
                    </div>

                </div>
            </div>
        </div>

        <PRFormLines 
          lines={lines} 
          updateLine={updateLine}
          removeLine={removeLine}
          clearLine={clearLine}
          addLine={addLine}
          handleClearLines={handleClearLines}
          openProductSearch={openProductSearch}
        />

        <PRFormSummary
            subtotal={subtotal}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            vatRate={vatRate}
            setVatRate={setVatRate}
            discountAmount={discountAmount}
            vatAmount={vatAmount}
            grandTotal={grandTotal}

        />

        {/* Tabs Section */}
        <div className={cardClass}>
          <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className={tabClass('detail')} onClick={() => setActiveTab('detail')}><FileBox size={14} /> Detail</div>
            <div className={tabClass('more')} onClick={() => setActiveTab('more')}><MoreHorizontal size={14} /> More</div>
            <div className={tabClass('rate')} onClick={() => setActiveTab('rate')}><Coins size={14} /> Rate</div>
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
