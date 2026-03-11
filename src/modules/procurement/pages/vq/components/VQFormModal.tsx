import React, { useState, useEffect } from 'react';
import { Pencil, FileText, Plus } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@/modules/master-data';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { useVQForm } from '../hooks/useVQForm';
import { RFQSelectorModal } from './RFQSelectorModal';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';
import { VQFormHeader } from './VQFormHeader';
import { VQFormLines } from './VQFormLines';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { RFQHeader } from '@/modules/procurement/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRFQ?: RFQHeader | null;
  vqId?: number | null;
  isViewMode?: boolean;
}

const VQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialRFQ, vqId, isViewMode = false }) => {
  const { toast } = useToast();
  // -- Custom Hook --
  const { 
    formMethods, totals, handleSave, updateLineCalculation, 
    handleSelectRFQ, handleClearRFQ,
    createEmptyLine,
    purchaseTaxOptions,
    currencyOptions,
    isMasterLoading,
    vqStatus,
    isDataLoading
  } = useVQForm(isOpen, onClose, initialRFQ, onSuccess, vqId, isViewMode);

  const {
    register,
    setValue,
    watch,
  } = formMethods;




  const watchCurrency = watch('currency');
  const watchExchangeRate = watch('exchange_rate');
  const watchVendorId = watch('vendor_id');
  const watchVendorCode = watch('vendor_code'); // Corrected
  const watchVendorName = watch('vendor_name');
  const watchRfqNo = watch('rfq_no');

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

  // REMOVED: Loop Terminator - This effect was causing infinite re-renders because 
  // updateLineCalculation calls setValue, which triggers this effect again.
  // Calculations are now handled by explicit onChange events in the inputs.

  // -- Handlers --
  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsProductModalOpen(true);
  };

  const selectProduct = (product: ProductLookup) => {
    if (activeRowIndex !== null) {
      setValue(`vq_lines.${activeRowIndex}.item_code`, product.item_code);
      setValue(`vq_lines.${activeRowIndex}.item_name`, product.item_name);
      setValue(`vq_lines.${activeRowIndex}.uom_name`, product.unit);
      setValue(`vq_lines.${activeRowIndex}.unit_price`, product.unit_price);
      setValue(`vq_lines.${activeRowIndex}.qty`, 1);
      
      setIsProductModalOpen(false);
    }
  };

    const handleClearVendor = () => {
    // Cascading wipe of vendor auto-filled data
    setValue('vendor_id', 0);
    setValue('vendor_name', '');
    setValue('contact_person', '');
    setValue('contact_phone', '');
    setValue('contact_email', '');
    setValue('payment_terms', '');
  };

  // -- Rendering Helpers --

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

  // Dynamic Title & Icon Logic (Standardized Pattern)
  const isPending = vqStatus === 'PENDING';
  const isRecorded = vqStatus === 'RECORDED';
  const isTerminalStatus = vqStatus === 'EXPIRED' || vqStatus === 'DECLINED' || vqStatus === 'CANCELLED';
  const forceViewMode = isViewMode || isTerminalStatus || isRecorded;
  const isLineReadonly = !!watchRfqNo || forceViewMode;

  const modalTitle = forceViewMode 
    ? "รายละเอียดใบเสนอราคาจากผู้ขาย (VIEW VENDOR QUOTATION)" 
    : (isPending 
        ? "บันทึกราคาใบเสนอราคา (RECORD VENDOR QUOTATION)" 
        : (isRecorded ? "แก้ไขใบเสนอราคาจากผู้ขาย (EDIT VENDOR QUOTATION)" : "สร้างใบเสนอราคาจากผู้ขาย (CREATE VENDOR QUOTATION)")
      );

  const HeaderIcon = (isPending || !vqId) ? Plus : (isRecorded ? Pencil : FileText);

  return (
    <FormProvider {...formMethods}>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><HeaderIcon size={14} strokeWidth={3} className="text-white" /></div>}
        headerColor="bg-indigo-600"
        footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors">
                  {forceViewMode ? 'ปิด' : 'ยกเลิก'}
              </button>
              {!forceViewMode && (
                  <button type="button" onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors">
                      บันทึก
                  </button>
              )}
          </div>
        }
      >
        {isDataLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
        ) : (
            <>

        <ProductSearchModal 
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSelect={selectProduct}
        />

        <VendorSearchModal 
            isOpen={isVendorModalOpen}
            onClose={() => setIsVendorModalOpen(false)}
            onSelect={(vendor) => {
                setValue('vendor_id', Number(vendor.vendor_id));
                setValue('vendor_code', vendor.vendor_code || '');
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
          <VQFormHeader
                forceViewMode={forceViewMode}
                isPending={isPending}
                isMasterLoading={isMasterLoading}
                currencyOptions={currencyOptions}
                watchVendorCode={watchVendorCode || ''}
                watchVendorName={watchVendorName || ''}
                watchVendorId={watchVendorId}
                watchRfqNo={watchRfqNo || ''}
                watchCurrency={watchCurrency}
                watchExchangeRate={watchExchangeRate || 1}
                onOpenVendorModal={() => !forceViewMode && setIsVendorModalOpen(true)}
                onClearVendor={handleClearVendor}
                onOpenRFQModal={() => !forceViewMode && setIsRFQModalOpen(true)}
                onClearRFQ={handleClearRFQ}
          />

          {/* 2. Line Items and Summary Card */}
          <VQFormLines
                forceViewMode={forceViewMode}
                isLineReadonly={isLineReadonly}
                units={units}
                onOpenProductSearch={openProductSearch}
                updateLineCalculation={updateLineCalculation}
                createEmptyLine={createEmptyLine}
                purchaseTaxOptions={purchaseTaxOptions}
                totals={totals}
          />
          
          {/* 3. Remarks Section */}
          <SharedRemarksTab
              activeTab={activeTab}
              onTabChange={setActiveTab}
              register={register('remark')}
              readOnly={forceViewMode}
              className="mt-4"
              placeholder="ระบุข้อความ..."
          />

      </div>
            </>
        )}
      </WindowFormLayout>
    </FormProvider>
  );
};

export default VQFormModal;