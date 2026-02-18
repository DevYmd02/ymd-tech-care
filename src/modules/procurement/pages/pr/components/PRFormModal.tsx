import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { FileText, Printer, Copy, CheckCircle, FileBox, MoreHorizontal, Coins, FileBarChart, History as HistoryIcon } from 'lucide-react';
import { PRHeader } from './PRHeader';
import { PRFormLines } from './PRFormLines';
import { PRFormSummary } from './PRFormSummary';
import { ProductSearchModal } from './ProductSearchModal';
import { WindowFormLayout } from '@ui';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { usePRForm } from '@/modules/procurement/hooks/usePRForm';
import type { PRFormData } from '@/modules/procurement/types/pr-types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  onSuccess?: () => void;
}

export const PRFormModal: React.FC<Props> = ({ isOpen, onClose, id, onSuccess }) => {
  const {
    isEditMode, lines, isProductModalOpen, setIsProductModalOpen, searchTerm, setSearchTerm,
    showAllItems, setShowAllItems,
    isSubmitting, isActionLoading,
    products, costCenters, projects, purchaseTaxOptions, isSearchingProducts,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, handleVendorSelect, onSubmit, handleApprove,
    handleVoid,
    handleFormError,
    formMethods,
    user
  } = usePRForm(isOpen, onClose, id, onSuccess);

  const { register, control, watch, formState: { errors } } = formMethods;

  // Tabs state
  const [activeTab, setActiveTab] = useState('detail');

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
  const tabClass = (tab: string) => `px-6 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`;

  const handleSubmitWrapper = async (data: PRFormData) => {
    return onSubmit(data);
  };

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
                <button 
                  type="button" 
                  onClick={() => formMethods.handleSubmit(handleSubmitWrapper, handleFormError)()} 
                  disabled={isSubmitting || isActionLoading} 
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium"
                >
                  {watch('is_on_hold') === 'Y' ? 'บันทึกแบบร่าง (Draft)' : 'บันทึกและส่งอนุมัติ'}
                </button>
            </div>
          </div>
      }
    >
      <FormProvider {...formMethods}>
          
          <ProductSearchModal 
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSearchingProducts={isSearchingProducts}
            products={products}
            selectProduct={selectProduct}
            showAllItems={showAllItems}
            setShowAllItems={setShowAllItems}
          />

          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-1.5 space-y-1">
            <div className={cardClass}>
                <PRHeader 
                    costCenters={costCenters}
                    projects={projects}
                    onVendorSelect={handleVendorSelect}
                    isEditMode={isEditMode}
                    onVoid={handleVoid}
                />
            </div>

            <div className={cardClass}>
                <div className="w-full overflow-x-auto border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <table className="w-full min-w-[800px] text-xs">
                    <thead className="bg-blue-600 text-white font-medium">
                        <tr>
                        <th className="px-2 py-1.5 text-left border-r border-blue-500 w-48 font-semibold">วันที่กำหนดส่ง</th>
                        <th className="px-2 py-1.5 text-left border-r border-blue-500 w-24 font-semibold">เครดิต (วัน)</th>
                        <th className="px-2 py-1.5 text-left border-r border-blue-500 font-semibold">Vendor Quote No.</th>
                        <th className="px-2 py-1.5 text-left border-r border-blue-500 font-semibold">ขนส่งโดย</th>
                        <th className="px-2 py-1.5 text-left font-semibold">ผู้จัดทำ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white dark:bg-gray-800">
                        <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700"><input type="date" {...register('delivery_date')} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none" /></td>
                        <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700 text-center text-gray-900 dark:text-white">{watch('credit_days')}</td>
                        <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700"><input {...register('vendor_quote_no')} placeholder="Quote No" className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none" /></td>
                        <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-700">
                            <select 
                            {...register('shipping_method')}
                            className={`w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border rounded px-2 py-0.5 focus:outline-none ${errors?.shipping_method ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                            >
                            <option value="">เลือก</option>
                            <option value="รถยนต์">รถยนต์</option>
                            <option value="รถบรรทุก">รถบรรทุก</option>
                            </select>
                        </td>
                        <td className="px-2 py-1 text-gray-900 dark:text-white">{user?.employee?.employee_fullname || user?.username || 'N/A'}</td>
                        </tr>
                    </tbody>
                    </table>
                </div>
            </div>

            {/* Multicurrency Toggle Section */}
            {/* Multicurrency Toggle Section */}
            <MulticurrencyWrapper control={control} name="isMulticurrency">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                        <input 
                            type="date" 
                            {...register('pr_exchange_rate_date')}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                        <select 
                            {...register('pr_base_currency_code')}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">เลือกสกุลเงิน</option>
                            <option value="THB">THB - บาท</option>
                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                            <option value="EUR">EUR - ยูโร</option>
                            <option value="JPY">JPY - เยน</option>
                            <option value="CNY">CNY - หยวน</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                        <select 
                            {...register('pr_quote_currency_code')}
                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">เลือกสกุลเงิน</option>
                            <option value="THB">THB - บาท</option>
                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                            <option value="EUR">EUR - ยูโร</option>
                            <option value="JPY">JPY - เยน</option>
                            <option value="CNY">CNY - หยวน</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                        <input 
                            type="number"
                            step="0.0001"
                            {...register('pr_exchange_rate', { valueAsNumber: true })}
                            readOnly={watch('pr_base_currency_code') === 'THB'}
                            className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${watch('pr_base_currency_code') === 'THB' ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
                        />
                        {watch('pr_base_currency_code') && watch('pr_base_currency_code') !== 'THB' && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                            1 {watch('pr_base_currency_code')} ≈ {Number(watch('pr_exchange_rate') || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                        </div>
                        )}
                    </div>
                </div>
            </MulticurrencyWrapper>

            <PRFormLines 
                lines={lines}
                updateLine={updateLine}
                removeLine={removeLine}
                clearLine={clearLine}
                addLine={addLine}
                handleClearLines={handleClearLines}
                openProductSearch={openProductSearch}
            />

            <PRFormSummary purchaseTaxOptions={purchaseTaxOptions} />

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
                <textarea 
                    {...register('remark')}
                    placeholder="กรอกหมายเหตุเพิ่มเติม..." 
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none" 
                />
                )}
                {activeTab === 'more' && <div className="text-gray-500 dark:text-gray-400 text-sm">ข้อมูลเพิ่มเติม...</div>}
                {activeTab === 'rate' && <div className="text-gray-500 dark:text-gray-400 text-sm">อัตราแลกเปลี่ยน / ราคา...</div>}
                {activeTab === 'description' && <div className="text-gray-500 dark:text-gray-400 text-sm">รายละเอียดเอกสาร...</div>}
                {activeTab === 'history' && <div className="text-gray-500 dark:text-gray-400 text-sm">ประวัติการแก้ไข...</div>}
            </div>
            </div>
        </div>
      </FormProvider>
    </WindowFormLayout>
  );
};

