import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import { DialogFormLayout } from '@ui';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { CustomerGeneralInfo } from '@customer/customer-master/components/CustomerGeneralInfo';
import { CustomerAddressList } from '@customer/customer-master/components/CustomerAddressList';
import { CustomerPaymentConditions } from '@customer/customer-master/components/CustomerPaymentConditions';
import { CustomerContactInfo } from '@customer/customer-master/components/CustomerContactInfo';
import { useCustomerForm } from '@customer/customer-master/hooks/useCustomerForm';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number; // Standardized to 'id'
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
        <div className="flex items-center justify-between w-full">
            <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                    <input 
                        type="checkbox" 
                        name="is_active" 
                        checked={formData.is_active} 
                        onChange={handleChange} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-green-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-500 transition-colors">
                    สถานะการใช้งาน (Active)
                </span>
            </label>

            <div className="flex gap-3">
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
            </form>
        </DialogFormLayout>
    );
}
