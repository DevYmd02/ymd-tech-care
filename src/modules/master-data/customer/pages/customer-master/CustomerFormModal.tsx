import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerMaster } from '@customer/types/customer-types';

import { DialogFormLayout } from '@ui';
import { useToast } from '@/shared/components/ui/feedback/Toast';

import { CustomerGeneralInfo } from '@customer/pages/customer-master/components/CustomerGeneralInfo';
import { CustomerAddressList } from '@customer/pages/customer-master/components/CustomerAddressList';
import { CustomerPaymentConditions } from '@customer/pages/customer-master/components/CustomerPaymentConditions';
import { CustomerContactInfo } from '@customer/pages/customer-master/components/CustomerContactInfo';
import { CustomerRemarks } from '@customer/pages/customer-master/components/CustomerRemarks';

import { useCustomerForm } from '@customer/hooks/useCustomerForm';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string; // Standardized to 'id'
    initialData?: CustomerMaster | null;
    onSuccess?: () => void;
}

export function CustomerFormModal(props: CustomerFormModalProps) {
    const { 
        isOpen, 
        onClose, 
        id, 
        initialData
    } = props;
    const isEdit = !!id || !!initialData;
    const { toast } = useToast();
    
    const {
        formData,
        errors,
        isLoading,
        isSubmitting,
        headerTitle,
        handleChange,
        handleSameAsRegisteredChange,
        addAddress,
        removeAddress,
        updateAddress,
        handleSubmit,
    } = useCustomerForm({ ...props, id, toast });

    // Footer Content
    const FormFooter = (
        <div className="flex justify-end gap-3 w-full">
            <button 
                type="button"
                onClick={onClose}
                className={styles.btnSecondary}
            >
                ยกเลิก
            </button>
            
            <button 
                type="submit" 
                form="customer-form"
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
            subtitle="กรอกข้อมูลลูกค้า/ลูกหนี้"
            footer={FormFooter}
            isLoading={isLoading}
        >
             <form id="customer-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    <CustomerGeneralInfo formData={formData} onChange={handleChange} errors={errors} />
                    <div className="space-y-6">
                        <CustomerContactInfo formData={formData} onChange={handleChange} />
                        <CustomerPaymentConditions formData={formData} onChange={handleChange} />
                    </div>
                </div>

                <CustomerAddressList
                    formData={formData}
                    errors={errors}
                    addAddress={addAddress}
                    removeAddress={removeAddress}
                    updateAddress={updateAddress}
                    handleSameAsRegisteredChange={handleSameAsRegisteredChange}
                />

                <CustomerRemarks 
                    formData={formData}
                    onChange={handleChange}
                />
            </form>
        </DialogFormLayout>
    );
}
