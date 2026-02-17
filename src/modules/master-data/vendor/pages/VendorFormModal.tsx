/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับ เพิ่ม/แก้ไข ข้อมูล Vendor (UI Refactor)
 * @purpose ใช้สำหรับ Quick Edit หรือ Add New จากหน้า Dashboard
 * @design Vertical layout with grouped sections (General, Contact, Address, Payment, Bank, etc.)
 */

import { 
    Save, 
    History
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { 
    VendorMaster
} from '@/modules/master-data/vendor/types/vendor-types';

import { DialogFormLayout } from '@ui';
import { useToast } from '@/shared/components/ui/feedback/Toast';

import { VendorGeneralInfo } from './components/VendorGeneralInfo';
import { VendorContactInfo } from './components/VendorContactInfo';
import { VendorAddressList } from './components/VendorAddressList';
import { VendorBankInfo } from './components/VendorBankInfo';
import { VendorAdditionalContacts } from './components/VendorAdditionalContacts';
import { VendorPaymentConditions } from './components/VendorPaymentConditions';
import { VendorRemarks } from './components/VendorRemarks';

import { useVendorForm } from '../hooks/useVendorForm';


interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string; // If provided, edit mode
    initialData?: VendorMaster | null; // Pre-filled data for edit mode
    onSuccess?: () => void;
    predictedVendorId?: string; // For Add Mode: Suggested ID
}

export function VendorFormModal(props: VendorFormModalProps) {
    const { isOpen, onClose, initialData, vendorId } = props;
    const isEdit = !!vendorId || !!initialData;
    const { toast } = useToast();
    
    const {
        formData,
        errors,
        isLoading,
        isSubmitting,
        headerTitle,
        handleChange,
        addBankAccount,
        removeBankAccount,
        updateBankAccount,
        addContactPerson,
        removeContactPerson,
        updateContactPerson,
        addAddress,
        removeAddress,
        updateAddress,
        handleSameAsRegisteredChange,
        handleCreditLimitChange,
        handleSubmit,
    } = useVendorForm({ ...props, toast });

    // Footer Content
    const FormFooter = (
        <div className="flex justify-end gap-3 w-full">
            {/* Last Modified Footer (Edit Mode Only) */}
            {initialData && (
                    <div className="mr-auto flex items-center gap-2 text-xs text-gray-400 italic">
                    <History size={14} />
                    <span>
                        แก้ไขล่าสุด: {new Date(initialData.updated_at).toLocaleString('th-TH', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })} โดย {initialData.updated_by || 'Unknown'}
                    </span>
                </div>
            )}

            <button 
                type="button"
                onClick={onClose}
                className={styles.btnSecondary}
            >
                ยกเลิก
            </button>
            
            <button 
                type="submit"
                form="vendor-form"
                disabled={isSubmitting}
                className={`${styles.btnPrimary} flex items-center gap-2`}
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึก')}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={headerTitle}
            subtitle="กรอกข้อมูลเจ้าหนี้/ซัพพลายเออร์"
            footer={FormFooter}
            isLoading={isLoading}
        >
             <form id="vendor-form" onSubmit={handleSubmit} className="space-y-8">
                
                <VendorGeneralInfo 
                    formData={formData} 
                    onChange={handleChange} 
                    errors={errors}
                />

                <VendorContactInfo 
                    formData={formData} 
                    onChange={handleChange} 
                    errors={errors}
                />

                <VendorAddressList 
                    formData={formData}
                    errors={errors}
                    addAddress={addAddress}
                    removeAddress={removeAddress}
                    updateAddress={updateAddress}
                    handleSameAsRegisteredChange={handleSameAsRegisteredChange}
                />

                <VendorPaymentConditions 
                    formData={formData}
                    onChange={handleChange}
                    onCreditLimitChange={handleCreditLimitChange}
                    errors={errors}
                />

                <VendorBankInfo 
                    formData={formData}
                    addBankAccount={addBankAccount}
                    removeBankAccount={removeBankAccount}
                    updateBankAccount={updateBankAccount}
                    errors={errors}
                />

                <VendorAdditionalContacts 
                    formData={formData}
                    addContactPerson={addContactPerson}
                    removeContactPerson={removeContactPerson}
                    updateContactPerson={updateContactPerson}
                    errors={errors}
                />

                <VendorRemarks 
                    formData={formData}
                    onChange={handleChange}
                    errors={errors}
                />

            </form>
        </DialogFormLayout>
    );
}

