import React, { useState, useEffect } from 'react';
import { Pencil, FileText, Plus } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@/modules/master-data';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal, type Product } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { useVQForm } from '../hooks/useVQForm';
import { RFQSelectorModal } from './RFQSelectorModal';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import { VQFormHeader } from './VQFormHeader';
import { VQFormLines } from './VQFormLines';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
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
    handleSelectRFQ, handleClearRFQ, handleClearVendor,
    createEmptyLine,
    purchaseTaxOptions,
    currencyOptions,
    isMasterLoading,
    vqStatus,
    isDataLoading
  } = useVQForm(isOpen, onClose, initialRFQ, onSuccess, vqId);

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
  const [showConfirm, setShowConfirm] = useState(false);

  // -- Effects --
  useEffect(() => {
    if (isOpen) {
      MasterDataService.getUnits().then(setUnits);
    }
  }, [isOpen]);

  // -- Handlers --
  const handleConfirmSave = () => {
    setShowConfirm(false); // Close immediately (Pro-Tip)
    handleSave();
  };
  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setIsProductModalOpen(true);
  };

  const selectProduct = (product: Product) => {
    if (activeRowIndex !== null) {
      console.log(`🎯 [VQFormModal] Selecting product for index ${activeRowIndex}:`, product);
      
      const index = activeRowIndex;
      setValue(`vq_lines.${index}.item_id`, Number(product.item_id));
      setValue(`vq_lines.${index}.item_code`, String(product.item_code || ''));
      setValue(`vq_lines.${index}.item_name`, String(product.item_name || ''));
      setValue(`vq_lines.${index}.uom_id`, Number(product.uom_id || 0));
      setValue(`vq_lines.${index}.uom_name`, String(product.uom_name || product.unit_name || ''));
      setValue(`vq_lines.${index}.unit_price`, Number(product.standard_cost) || 0);
      setValue(`vq_lines.${index}.qty`, 1);
      
      // Trigger calculation
      updateLineCalculation(index);

      setIsProductModalOpen(false);
      setActiveRowIndex(null); // Clear active index
    } else {
      console.warn('⚠️ [VQFormModal] selectProduct called but activeRowIndex is null');
    }
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
                  <button 
                      type="button" 
                      onClick={() => {
                        console.log('💾 Triggering Confirmation for VQ...');
                        setShowConfirm(true);
                      }}
                      disabled={isDataLoading}
                      className={`px-6 py-2 rounded-md text-sm font-medium shadow-sm transition-colors ${isDataLoading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
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
                setValue('vendor_id', Number(vendor.vendor_id), { shouldValidate: true });
                setValue('vendor_code', vendor.vendor_code || '', { shouldValidate: true });
                setValue('vendor_name', vendor.name, { shouldValidate: true });
                // contact_person omitted as it's not in VendorSearchItem
                setValue('contact_phone', vendor.phone || '', { shouldValidate: true });
                setValue('contact_email', vendor.email || '', { shouldValidate: true });
                setValue('payment_terms', vendor.payment_term_days ? `${vendor.payment_term_days} วัน` : '', { shouldValidate: true });
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
                watchVendorId={watchVendorId || 0}
                watchRfqNo={watchRfqNo || ''}
                watchCurrency={watchCurrency || 'THB'}
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

        <ConfirmationModal 
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmSave}
            title="ยืนยันการบันทึก"
            description="คุณต้องการบันทึกข้อมูลใบเสนอราคานี้ใช่หรือไม่?"
            confirmText="บันทึก"
            cancelText="ยกเลิก"
            variant="info"
        />
      </WindowFormLayout>
    </FormProvider>
  );
};

export default VQFormModal;