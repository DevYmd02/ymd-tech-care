import React from 'react';
import { FileText, Trash2, Printer, Copy, CheckCircle } from 'lucide-react';
import { PRHeader } from './PRHeader';
import { PRFormLines } from './PRFormLines';
import { PRFormSummary } from './PRFormSummary';
import { WindowFormLayout } from '@/shared/components/layout/WindowFormLayout';
import { SystemAlert } from '@/shared/components/ui/SystemAlert';
import { usePRForm } from '@/modules/procurement/hooks/usePRForm';

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
    addLine, removeLine, updateLine, handleClearLines,
    openProductSearch, selectProduct, subtotal, discountAmount,
    vatAmount, grandTotal, handleVendorSelect, onSubmit, handleDelete, handleApprove
  } = usePRForm(isOpen, onClose, id, onSuccess);

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';

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
                        <button type="button" onClick={handleDelete} disabled={isSubmitting || isActionLoading} className="flex items-center px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"><Trash2 size={16} className="mr-2" /> ลบเอกสาร</button>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"><Printer size={16} className="mr-2" /> พิมพ์</button>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium"><Copy size={16} className="mr-2" /> คัดลอก</button>
                    </>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} disabled={isSubmitting || isActionLoading} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium">ยกเลิก</button>
                {isEditMode && (
                    <button type="button" onClick={handleApprove} disabled={isSubmitting || isActionLoading} className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium flex items-center gap-2"><CheckCircle size={16} /> อนุมัติ</button>
                )}
                <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isActionLoading} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium">บันทึก</button>
            </div>
        </div>
      }
    >
      {alertState.show && <SystemAlert message={alertState.message} onClose={() => setAlertState({ ...alertState, show: false })} />}
      
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setIsProductModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ค้นหาสินค้า</h2>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="รหัสสินค้าหรือชื่อสินค้า" className="w-full h-10 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-200" autoFocus />
            </div>
            <div className="max-h-[450px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-center w-20">เลือก</th>
                    <th className="px-3 py-3 text-left">รหัสสินค้า</th>
                    <th className="px-3 py-3 text-left">ชื่อสินค้า</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.item_id} className="border-b border-gray-100 hover:bg-cyan-50">
                      <td className="px-3 py-3 text-center"><button onClick={() => selectProduct(p)} className="px-3 py-1 bg-cyan-600 text-white rounded text-xs">เลือก</button></td>
                      <td className="px-3 py-3 font-medium">{p.item_code}</td>
                      <td className="px-3 py-3">{p.item_name}</td>
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
          <PRHeader register={register} setValue={setValue} watch={watch} costCenters={costCenters} projects={projects} onVendorSelect={handleVendorSelect} />
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
                    <tr>
                      <td className="px-2 py-1 border-r border-gray-300"><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 p-1" /></td>
                      <td className="px-2 py-1 border-r border-gray-300 text-center">{creditDays}</td>
                      <td className="px-2 py-1 border-r border-gray-300"><input value={vendorQuoteNo} onChange={(e) => setVendorQuoteNo(e.target.value)} placeholder="Quote No" className="w-full" /></td>
                      <td className="px-2 py-1 border-r border-gray-300"><select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className="w-full"><option value="รถยนต์">รถยนต์</option><option value="รถบรรทุก">รถบรรทุก</option></select></td>
                      <td className="px-2 py-1">{requesterName}</td>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>

        <PRFormLines 
          lines={lines} 
          updateLine={updateLine}
          removeLine={removeLine}
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
      </div>
    </WindowFormLayout>
  );
};
